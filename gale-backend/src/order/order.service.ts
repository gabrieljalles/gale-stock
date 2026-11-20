import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CatalogService } from 'src/catalog/catalog.service';
import {
  CreateFullOrderDto,
  CreateOrderAddressDto,
  CreateOrderDto,
} from './dto/create-order.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { AssignDriverDto, ToggleChecklistDto } from './dto/kanban.dto';
import { GeocodingService } from './geocoding.service';
import { CreateCustomerOrderDto } from './dto/create-customer-order.dto';
import { UserService } from 'src/user/user.service';
import { SettingsService } from 'src/settings/settings.service';
import { WorkDayService } from 'src/work-day/work-day.service';
import { NotFoundError } from 'rxjs';
import {
  DeliveryType,
  OrderSource,
  OrderStatus,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { getUnitPrice } from 'src/utils/pricing.utils';
import { calculatePaymentFee } from 'src/utils/payment-fee.utils';
import { PointsService } from 'src/points/points.service';

// O tipo do logradouro fica num campo separado do nome da rua, então
// precisa ser reunido de volta na hora de procurar o endereço no mapa —
// "vinte e um" não acha nada, "Avenida vinte e um" tem chance.
const TYPE_ADDRESS_LABELS: Record<string, string> = {
  Street: 'Rua',
  Avanue: 'Avenida',
  Alley: 'Beco',
  Lane: 'Travessa',
  Highway: 'Rodovia',
  Road: 'Estrada',
  Square: 'Praça',
  Village: 'Vila',
  Condominium: 'Condomínio',
};

// Variações da busca, da mais específica pra mais frouxa. O OSM em cidades
// menores costuma ter a via mapeada mas não o número da casa, então cair
// pra "rua + cidade" ainda dá uma localização útil pra separar entregas.
// O CEP entra logo depois da busca completa: quando o OSM conhece o CEP, o
// ponto é o quarteirão certo — melhor que um trecho qualquer de uma avenida
// comprida, que é no que a busca frouxa por rua costuma cair.
const buildGeocodeQueries = (
  item: {
    typeAddress: string;
    address: string;
    number: string;
    district: string;
    zipCode?: string | null;
  },
  city: string,
  state: string,
): string[] => {
  const label = TYPE_ADDRESS_LABELS[item.typeAddress] ?? '';
  // Não repete o tipo quando o usuário já digitou ("R. Santa Catarina").
  const alreadyTyped = new RegExp(`^\\s*(${label}|${label.slice(0, 1)}\\.)`, 'i');
  const street =
    label && !alreadyTyped.test(item.address)
      ? `${label} ${item.address}`
      : item.address;

  const place = `${city}, ${state}, Brasil`;

  // O CEP pode estar salvo com ou sem máscara; o Nominatim espera 00000-000.
  const digits = (item.zipCode ?? '').replace(/\D/g, '');
  const cep =
    digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : null;

  return [
    `${street}, ${item.number}, ${item.district}, ${place}`,
    ...(cep ? [`${cep}, ${place}`] : []),
    `${street}, ${item.district}, ${place}`,
    `${street}, ${place}`,
  ];
};

// Teto de pedidos de delivery vivos por cliente. Nada a ver com notinha
// ou dívida: existe só pra ninguém encher a fila de pedidos.
const MAX_OPEN_DELIVERY_ORDERS = 2;

// Etapas em que o pedido ainda não foi montado e, por isso, aceita itens
// novos sem cobrar outra entrega. "Pronto" ficou de fora de propósito: a
// sacola já está fechada, e "A caminho", com o motoboy na rua.
const EDITABLE_STATUSES: OrderStatus[] = [
  OrderStatus.Confirmed,
  OrderStatus.Preparing,
];

@Injectable()
export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly catalogService: CatalogService,
    private readonly userService: UserService,
    private readonly settingsService: SettingsService,
    private readonly workDayService: WorkDayService,
    private readonly geocodingService: GeocodingService,
    private readonly pointsService: PointsService,
  ) {}

  async createOrderByShopper(dto: CreateFullOrderDto, requesterRole?: string) {
    const { order, orderDetails, orderTransaction, orderAddress } = dto;
    const now = new Date();

    const settings = await this.settingsService.getSettings();

    // Admin pode vender a qualquer momento, mesmo com a loja fechada
    // (manual ou automaticamente pelo horário de fechamento).
    if (requesterRole !== 'Admin') {
      const storeOpenNow = await this.settingsService.isStoreOpenNow(now);
      if (!storeOpenNow) {
        throw new ForbiddenException(
          'A loja está fechada no momento. Não é possível registrar novos pedidos.',
        );
      }
    }

    const isNight = await this.settingsService.isNightPrice(now);
    const freightValue = Number(settings.freightPrice);
    // Se a loja estiver fechada (venda feita pelo Admin), fica sem dia de
    // trabalho por enquanto; é atribuída ao próximo dia quando a loja abrir.
    const workDayId = await this.workDayService.findOpenWorkDayId();

    //Separeting IDS
    const clientId = order.clientId?.trim();
    const userAddressId = order.userAddressId?.trim();
    const deliveryManId = order.deliveryManId?.trim();
    const transactionType = orderTransaction?.transactionType?.trim();
    const productsIds = orderDetails.map((d) => d.productId);

    //checking the ids
    const address = userAddressId
      ? await this.userService.findAddressByAddressId(userAddressId)
      : null;
    const client = clientId
      ? await this.userService.findUserById(clientId)
      : null;
    const products =
      await this.catalogService.findManyProductsByIds(productsIds);

    //on the bill payment
    if (transactionType === TransactionType.OnTheBill) {
      if (!client) {
        throw new NotFoundException(
          `Cliente precisa estar atríbuido para esse tipo de pagamento.`,
        );
      }

      // Admin pode dar notinha pra qualquer cliente; os demais só podem
      // atribuir a clientes já autorizados (canPayOnTheBill).
      if (!client.canPayOnTheBill && requesterRole !== 'Admin') {
        throw new ForbiddenException(
          `Cliente ${client.fullName} não está autorizado a pegar fiado.`,
        );
      }
    }

    return this.repository.runInTransaction(async (tx) => {
      let orderCreated;
      let freightPrice;
      let totalProductPrice: Prisma.Decimal = new Prisma.Decimal(0);
      let isPaid;
      let paidDate;

      //Create an Order
      try {
        switch (order.deliveryType) {
          case DeliveryType.InStore:
            order.orderSource = OrderSource.Local;
            freightPrice = 0;
            if (
              transactionType &&
              transactionType !== TransactionType.OnTheBill
            ) {
              order.orderStatus = OrderStatus.Concluded;
              isPaid = true;
              paidDate = now;
            } else {
              order.orderStatus = OrderStatus.PickedUp;
              if (!client) {
                throw new NotFoundException(
                  `Cliente precisa estar atribuído para pagamento posterior ao consumo.`,
                );
              }
            }
            break;

          case DeliveryType.Delivery:
            // Vindo da "Nova Venda" (Call): o admin/vendedor já recebeu o
            // pedido pessoalmente, então pula a etapa "Recebido" do Kanban
            // e entra direto em preparação. Vindo de outro lugar (app do
            // cliente, iFood, etc.): entra em "Recebido" normalmente.
            order.orderStatus =
              order.orderSource === OrderSource.Call
                ? OrderStatus.Preparing
                : OrderStatus.Confirmed;
            freightPrice = freightValue;
            break;
        }

        let clientConnect: { connect: { id: string } } | undefined;
        if (clientId) {
          await this.userService.findUserById(clientId);
          clientConnect = { connect: { id: clientId } };
        }

        let deliveryManConnect: { connect: { id: string } } | undefined;
        if (deliveryManId) {
          await this.userService.ensureDeliveryMan(deliveryManId);
          deliveryManConnect = { connect: { id: deliveryManId } };
        }

        const orderPayload: Prisma.OrderCreateInput = {
          deliveryType: order.deliveryType,
          orderSource: order.orderSource!,
          orderStatus: order.orderStatus,
          ...(clientConnect && { client: clientConnect }),
          ...(deliveryManConnect && { deliveryMan: deliveryManConnect }),
          ...(workDayId && { workDay: { connect: { id: workDayId } } }),
        };

        orderCreated = await this.repository.createOrder(orderPayload, tx);
        console.log('✅ Created an order.');
      } catch (err) {
        console.error('❌ Error creating an order:', err);
        throw err;
      }

      //Insert Order details
      try {
        // Baixar o estoque (FIFO) antes de confirmar o pedido, guardando
        // quanto de custo (landedUnitCost dos lotes baixados) cada item
        // consumiu — usado depois pra calcular lucro por dia de trabalho.
        const productsOutOfStock: string[] = [];
        // Alinhado por índice (não por productId) para não colidir caso o
        // mesmo produto apareça em mais de uma linha do pedido.
        const costPerLine: Prisma.Decimal[] = [];

        for (const item of orderDetails) {
          const stockEntries =
            await this.repository.findAvailableStockEntriesByProductId(
              item.productId,
              tx,
            );

          const totalAvailable = stockEntries.reduce(
            (sum, entry) => sum + entry.quantityOnStock,
            0,
          );

          if (totalAvailable < item.quantity) {
            throw new BadRequestException(
              `Estoque insuficiente para o produto ${item.productId}. Disponível: ${totalAvailable}, Solicitado: ${item.quantity}`,
            );
          }

          let remainingToDeduct = item.quantity;
          let itemCost = new Prisma.Decimal(0);

          for (const entry of stockEntries) {
            if (remainingToDeduct <= 0) break;

            const deductFromThisEntry = Math.min(
              entry.quantityOnStock,
              remainingToDeduct,
            );
            const newQuantity = entry.quantityOnStock - deductFromThisEntry;

            await this.repository.updateStockEntryQuantity(
              entry.id,
              newQuantity,
              tx,
            );

            itemCost = itemCost.add(
              entry.landedUnitCost.mul(deductFromThisEntry),
            );
            remainingToDeduct -= deductFromThisEntry;
          }

          costPerLine.push(itemCost);

          if (totalAvailable - item.quantity === 0) {
            productsOutOfStock.push(item.productId);
          }
        }

        const detailsWithPrices = orderDetails.map((item, index) => {
          const product = products.find((p) => p.id === item.productId);

          if (!product) {
            throw new NotFoundException(
              `Produto com ${item.productId} não encontrado.`,
            );
          }

          if (product.consumerPrice == null) {
            throw new NotFoundException(
              `Preço não definido para o produto ${item.productId}`,
            );
          }

          const isIfoodSource = order.orderSource === OrderSource.Ifood;

          const unityPrice = getUnitPrice(
            product,
            item.quantity,
            isNight,
            isIfoodSource,
          );
          const totalPrice = unityPrice.mul(item.quantity);

          return {
            order: { connect: { id: orderCreated.id } },
            catalog: { connect: { id: item.productId } },
            productName: product.product.name,
            quantity: item.quantity,
            unityPrice,
            totalPrice,
            totalCost: costPerLine[index],
          };
        });

        for (const detail of detailsWithPrices) {
          await this.repository.createOrderDetails(detail, tx);
          totalProductPrice = totalProductPrice.add(detail.totalPrice);
        }

        if (productsOutOfStock.length > 0) {
          await this.catalogService.updateProductsAvailability(
            productsOutOfStock,
            false,
            tx,
          );
        }

        console.log('✅ Created orderDetails and updated stock.');
      } catch (err) {
        console.error('❌ Error creating orderDetails:', err);
        throw err;
      }

      //Insert Order Transaction
      try {
        // Resgate de pontos. Abate SÓ o valor dos produtos — por isso a
        // conta vem antes de somar o frete, que nunca pode ser abatido.
        // Estourar qualquer limite do resgate derruba a transação inteira,
        // e o estoque baixado volta junto.
        const redemption = await this.pointsService.validateRedemption(
          clientId,
          orderTransaction?.pointsToRedeem ?? 0,
          totalProductPrice,
          tx,
        );

        const totalPrice = totalProductPrice
          .add(freightPrice)
          .sub(redemption.discount);

        // Notinha tem teto. A checagem só pode acontecer aqui: é o primeiro
        // ponto que conhece o total final, já com frete. Estourar o limite
        // derruba a transação inteira, então nada de estoque baixado fica
        // para trás.
        if (transactionType === TransactionType.OnTheBill && clientId) {
          await this.userService.assertOnTheBillWithinLimit(
            clientId,
            Number(totalPrice),
          );
        }

        // Taxa da maquininha: incide sobre o total e sai do que a loja
        // recebe. Notinha resolve para 0 aqui — a taxa só nasce quando a
        // conta é fechada com um método de recebimento real (closeTab).
        const { feePercent, feeAmount } = calculatePaymentFee(
          totalPrice,
          transactionType as TransactionType,
          settings,
        );

        const transactionPayload = {
          order: { connect: { id: orderCreated.id } },
          transactionType: transactionType as TransactionType,
          totalProductPrice,
          freightPrice,
          totalPrice,
          feePercent,
          feeAmount,
          pointsRedeemed: redemption.points,
          pointsDiscountAmount: redemption.discount,
          isPaid,
          paidDate,
        };

        const transactionCreated = await this.repository.createOrderTransaction(
          transactionPayload,
          tx,
        );

        if (redemption.points.greaterThan(0) && clientId) {
          await this.pointsService.consumeForOrder(
            tx,
            clientId,
            redemption.points,
            orderCreated.id,
            transactionCreated.id,
          );
        }

        // Pontuar aqui só acontece quando o dinheiro JÁ entrou: venda de
        // balcão paga na hora. Notinha e delivery nascem sem pagamento e
        // pontuam depois, no fechamento da conta ou na entrega.
        if (isPaid) {
          await this.pointsService.awardForPayment(tx, {
            orderId: orderCreated.id,
            orderTransactionId: transactionCreated.id,
            clientId,
            transactionType: transactionType as TransactionType,
            // A parte paga com pontos não gera pontos de novo.
            productBasis: totalProductPrice.sub(redemption.discount),
            openedAt: orderCreated.createdAT,
            paidAt: paidDate ?? now,
          });
        }

        console.log('✅ Created orderTransaction.');
      } catch (err) {
        console.error('❌ Error creating orderTransaction:', err);
        throw err;
      }

      //Insert Order Address
      if (orderCreated.deliveryType === DeliveryType.Delivery) {
        if (!address && !orderAddress) {
          throw new BadRequestException(
            'É preciso informar um endereço para entrega.',
          );
        }

        try {
          const addressPayload: Prisma.OrderAddressCreateInput = {
            order: { connect: { id: orderCreated.id } },
            recipientName: orderAddress?.recipientName ?? client?.fullName,
            typeAddress: address?.typeAddress ?? orderAddress!.typeAddress!,
            address: address?.address ?? orderAddress!.address!,
            number: address?.number ?? orderAddress!.number!,
            district: address?.district ?? orderAddress!.district!,
            complement: address?.complement ?? orderAddress?.complement,
            zipCode: address?.zipCode ?? orderAddress?.zipCode,
          };

          await this.repository.createOrderAddress(addressPayload, tx);
          console.log('✅ Created orderAddress');
        } catch (err) {
          console.error('❌ Error creating orderAddress', err);
          throw err;
        }
      }
    });
  }

  // Pedido feito pelo próprio cliente na vitrine. Reaproveita todo o fluxo
  // da venda de balcão (baixa de estoque FIFO, preço calculado no servidor,
  // dia de trabalho), só que com os campos sensíveis fixados aqui — nada
  // do que o navegador manda decide preço, dono do pedido ou origem.
  /**
   * Pedidos de delivery que ainda estao em jogo para um cliente.
   *
   * "Em aberto" termina em Entregue - pago ou nao. A notinha e outro
   * assunto (divida), e travar a fila por causa dela seria misturar
   * controle de credito com controle de fila.
   */
  private async findOpenDeliveryOrders(clientId: string) {
    return this.repository.findOpenDeliveryOrdersByClient(clientId);
  }

  /**
   * Situacao do cliente na fila, pro checkout saber o que oferecer.
   *
   * Duas coisas diferentes: quantos pedidos ele ainda pode abrir, e se
   * existe um pedido que ainda aceita itens novos.
   */
  async getMyDeliveryOrderStatus(clientId: string) {
    const orders = await this.findOpenDeliveryOrders(clientId);

    const editable = orders.find((order) =>
      EDITABLE_STATUSES.includes(order.orderStatus),
    );

    return {
      openOrderCount: orders.length,
      maxOpenOrders: MAX_OPEN_DELIVERY_ORDERS,
      canPlaceNewOrder: orders.length < MAX_OPEN_DELIVERY_ORDERS,
      editableOrder: editable
        ? {
            id: editable.id,
            orderStatus: editable.orderStatus,
            itemCount: (editable.orderDetails ?? []).reduce(
              (sum, detail) => sum + detail.quantity,
              0,
            ),
            totalPrice: Number(editable.orderTransaction?.[0]?.totalPrice ?? 0),
          }
        : null,
      // Pedidos ja fora do alcance do cliente - a tela usa isso pra
      // explicar por que nao da pra mexer neles.
      lockedOrders: orders
        .filter((order) => !EDITABLE_STATUSES.includes(order.orderStatus))
        .map((order) => ({ id: order.id, orderStatus: order.orderStatus })),
    };
  }

  /**
   * Acrescenta produtos a um pedido que o cliente ja fez.
   *
   * So vale enquanto o pedido nao foi montado: depois de "Pronto" a sacola
   * esta fechada, e depois de "A caminho" o motoboy ja saiu - nos dois
   * casos o jeito e abrir um pedido novo, com frete proprio.
   *
   * Nao cobra frete de novo, porque e a mesma entrega.
   */
  async addItemsToMyOrder(
    orderId: string,
    clientId: string,
    items: { productId: string; quantity: number }[],
  ) {
    if (items.length === 0) {
      throw new BadRequestException('Nenhum produto informado.');
    }

    return this.repository.runInTransaction(async (tx) => {
      const order = await this.repository.findOrderForEdit(orderId, tx);
      if (!order) throw new NotFoundException('Pedido nao encontrado.');

      // O dono vem do banco, nunca do corpo da requisicao.
      if (order.clientId !== clientId) {
        throw new ForbiddenException('Esse pedido nao e seu.');
      }

      if (!EDITABLE_STATUSES.includes(order.orderStatus)) {
        throw new BadRequestException(
          'Esse pedido ja foi montado e nao aceita mais itens. Faca um novo pedido.',
        );
      }

      const settings = await this.settingsService.getSettings();
      const isNight = await this.settingsService.isNightPrice();
      const products = await this.catalogService.findManyProductsByIds(
        items.map((item) => item.productId),
      );

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new NotFoundException(
            `Produto ${item.productId} nao encontrado.`,
          );
        }
        if (product.consumerPrice == null) {
          throw new NotFoundException(
            `Preco nao definido para o produto ${item.productId}`,
          );
        }

        // Mesma baixa FIFO da venda normal: o custo sai dos lotes mais
        // antigos, pro CMV continuar verdadeiro.
        const stockEntries =
          await this.repository.findAvailableStockEntriesByProductId(
            item.productId,
            tx,
          );
        const totalAvailable = stockEntries.reduce(
          (sum, entry) => sum + entry.quantityOnStock,
          0,
        );
        if (totalAvailable < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para ${product.product.name}. Disponivel: ${totalAvailable}.`,
          );
        }

        let remaining = item.quantity;
        let itemCost = new Prisma.Decimal(0);
        for (const entry of stockEntries) {
          if (remaining <= 0) break;
          const take = Math.min(entry.quantityOnStock, remaining);
          await this.repository.updateStockEntryQuantity(
            entry.id,
            entry.quantityOnStock - take,
            tx,
          );
          itemCost = itemCost.add(entry.landedUnitCost.mul(take));
          remaining -= take;
        }

        if (totalAvailable - item.quantity === 0) {
          await this.catalogService.updateProductsAvailability(
            [item.productId],
            false,
            tx,
          );
        }

        const unityPrice = getUnitPrice(product, item.quantity, isNight, false);

        await this.repository.createOrderDetails(
          {
            order: { connect: { id: orderId } },
            catalog: { connect: { id: item.productId } },
            productName: product.product.name,
            quantity: item.quantity,
            unityPrice,
            totalPrice: unityPrice.mul(item.quantity),
            totalCost: itemCost,
          },
          tx,
        );
      }

      // Recalcula o total a partir das linhas, e com ele a taxa de cartao.
      // O frete NAO entra de novo: e a mesma viagem.
      const details = await this.repository.findOrderDetailsByOrderId(
        orderId,
        tx,
      );
      const transaction = order.orderTransaction[0];

      if (transaction) {
        const totalProductPrice = details.reduce(
          (sum, detail) => sum.add(detail.totalPrice),
          new Prisma.Decimal(0),
        );
        const totalPrice = totalProductPrice
          .add(transaction.freightPrice)
          .add(transaction.interestAmount);

        // Acrescentar item num pedido de notinha aumenta a dívida, então
        // vale o mesmo teto da criação. Desconta o que este pedido já
        // ocupa do limite, senão ele seria contado duas vezes.
        if (transaction.transactionType === TransactionType.OnTheBill) {
          const alreadyCounted = transaction.isPaid
            ? 0
            : Number(transaction.totalPrice);
          await this.userService.assertOnTheBillWithinLimit(
            clientId,
            Number(totalPrice) - alreadyCounted,
          );
        }

        const { feePercent, feeAmount } = calculatePaymentFee(
          totalPrice,
          transaction.transactionType,
          settings,
        );

        await this.repository.updateOrderTransaction(
          transaction.id,
          { totalProductPrice, totalPrice, feePercent, feeAmount },
          tx,
        );
      }

      return { added: items.length, orderId };
    });
  }

  async createOrderByCustomer(dto: CreateCustomerOrderDto, userId: string) {
    // Notinha não é bloqueada aqui de propósito: quem decide é a mesma
    // regra do balcão (createOrderByShopper), que exige canPayOnTheBill do
    // cliente. Como abaixo o pedido é enviado com o papel 'Client', um
    // cliente não autorizado recebe 403 — sem duplicar a regra.
    const settings = await this.settingsService.getSettings();
    if (!settings.deliveryEnabled) {
      throw new ForbiddenException('A loja não está fazendo entregas.');
    }

    // Fila do cliente: no máximo dois pedidos vivos ao mesmo tempo. Segura
    // quem dispara pedidos em sequência e entope a aba Pedidos. Entregue
    // libera a vaga na hora, tenha sido pago ou não.
    const openOrders = await this.findOpenDeliveryOrders(userId);
    if (openOrders.length >= MAX_OPEN_DELIVERY_ORDERS) {
      throw new ForbiddenException(
        `Você já tem ${MAX_OPEN_DELIVERY_ORDERS} pedidos em andamento. Aguarde a entrega de um deles para fazer outro.`,
      );
    }

    if (!dto.userAddressId && !dto.orderAddress) {
      throw new BadRequestException(
        'Escolha um endereço salvo ou informe um para a entrega.',
      );
    }

    // Endereço salvo tem que ser do próprio cliente.
    if (dto.userAddressId) {
      const address = await this.userService.findAddressByAddressId(
        dto.userAddressId,
      );
      if (address.userId !== userId) {
        throw new ForbiddenException('Esse endereço não é seu.');
      }
    }

    return this.createOrderByShopper(
      {
        order: {
          deliveryType: DeliveryType.Delivery,
          orderSource: OrderSource.App,
          clientId: userId,
          userAddressId: dto.userAddressId,
        },
        orderDetails: dto.orderDetails,
        orderTransaction: {
          transactionType: dto.transactionType,
          pointsToRedeem: dto.pointsToRedeem,
        },
        orderAddress: dto.orderAddress ?? ({} as CreateOrderAddressDto),
      },
      // Passa como cliente comum de propósito: assim a loja fechada
      // bloqueia o pedido, como bloquearia qualquer não-Admin.
      'Client',
    );
  }

  // Notinhas em aberto, condensadas por cliente (nome, total devido e os
  // produtos comprados em cada pedido ainda não pago).
  async getOpenTabs() {
    const orders = await this.repository.findOpenTabOrders();

    const byClient = new Map<
      string,
      {
        clientId: string;
        clientName: string;
        total: number;
        orders: {
          orderId: string;
          createdAt: Date;
          total: number;
          products: {
            productName: string;
            quantity: number;
            unityPrice: number;
            totalPrice: number;
          }[];
        }[];
      }
    >();

    for (const order of orders) {
      if (!order.client) continue;

      const orderTotal = (order.orderTransaction ?? []).reduce(
        (sum, tx) => sum + Number(tx.totalPrice),
        0,
      );

      const existing = byClient.get(order.clientId!) ?? {
        clientId: order.clientId!,
        clientName: order.client.fullName,
        total: 0,
        orders: [],
      };

      existing.total += orderTotal;
      existing.orders.push({
        orderId: order.id,
        createdAt: order.createdAT,
        total: orderTotal,
        products: (order.orderDetails ?? []).map((detail) => ({
          productName: detail.productName,
          quantity: detail.quantity,
          unityPrice: Number(detail.unityPrice),
          totalPrice: Number(detail.totalPrice),
        })),
      });

      byClient.set(order.clientId!, existing);
    }

    return Array.from(byClient.values()).sort((a, b) => b.total - a.total);
  }

  // Fecha a conta: marca todas as notinhas em aberto desse cliente como
  // pagas, com o método de pagamento real escolhido na hora. O faturamento
  // dessas vendas passa a contar no dia de trabalho em que foram PAGAS
  // (não no dia em que os produtos saíram) — se a loja estiver fechada
  // agora, ficam pendentes até a próxima abertura, igual às vendas do
  // Admin com a loja fechada.
  async closeTab(
    clientId: string,
    transactionType: TransactionType,
    interestAmount = 0,
  ) {
    return this.repository.runInTransaction(async (tx) => {
      // Mais antigo primeiro — a multa é somada só na notinha mais velha.
      const orders = await this.repository.findOpenTabOrdersByClient(
        clientId,
        tx,
      );

      if (orders.length === 0) {
        throw new NotFoundException(
          'Nenhuma notinha em aberto para esse cliente.',
        );
      }

      const workDayId = await this.workDayService.findOpenWorkDayId();
      const interestDecimal = new Prisma.Decimal(interestAmount);
      const settings = await this.settingsService.getSettings();
      const paidAt = new Date();

      for (const [index, order] of orders.entries()) {
        const transactions = order.orderTransaction ?? [];

        // A notinha vira um recebimento de verdade só agora: a taxa da
        // maquininha é calculada com a alíquota de hoje, sobre o total já
        // acrescido dos juros. A multa entra só na primeira transação da
        // notinha mais antiga — aplicá-la em todas cobraria repetido.
        const updates = transactions.map((transaction, position) => {
          const interest =
            index === 0 && position === 0
              ? interestDecimal
              : new Prisma.Decimal(0);
          const totalPrice = new Prisma.Decimal(transaction.totalPrice).add(
            interest,
          );
          const { feePercent, feeAmount } = calculatePaymentFee(
            totalPrice,
            transactionType,
            settings,
          );

          return {
            id: transaction.id,
            totalPrice,
            interestAmount: interest,
            feePercent,
            feeAmount,
          };
        });

        await this.repository.closeTabOrder(
          order.id,
          workDayId,
          transactionType,
          updates,
          tx,
        );

        // Fechar a notinha é o único momento em que ela pontua, e com a
        // taxa da forma de pagamento usada AGORA. Fora do prazo de
        // carência, awardForPayment devolve zero — o programa não
        // financia quem demora a pagar.
        for (const transaction of transactions) {
          await this.pointsService.awardForPayment(tx, {
            orderId: order.id,
            orderTransactionId: transaction.id,
            clientId,
            transactionType,
            // Juros e frete ficam de fora: pontua só o produto.
            productBasis: new Prisma.Decimal(transaction.totalProductPrice).sub(
              transaction.pointsDiscountAmount,
            ),
            openedAt: order.createdAT,
            paidAt,
            applyGrace: true,
          });
        }
      }

      return { closedOrders: orders.length };
    });
  }

  /**
   * "Meus pedidos" da vitrine: o que o próprio cliente vê.
   *
   * Recorte deliberadamente pobre — nada de custo, margem ou taxa de
   * maquininha. O cliente vê o que comprou, quanto pagou e em que pé está.
   *
   * Um pedido está "em aberto" enquanto não foi entregue/concluído nem
   * cancelado. Notinha entregue mas não paga continua em aberto, porque do
   * ponto de vista do cliente ainda há algo pendente: a conta.
   */
  async findMyOrders(clientId: string) {
    const orders = await this.repository.findOrdersByClient(clientId);

    return orders.map((order) => {
      const transaction = order.orderTransaction?.[0];
      const isPaid = transaction?.isPaid ?? false;

      const isCancelled =
        order.orderStatus === OrderStatus.Cancelled ||
        order.orderStatus === OrderStatus.DeliveryFailed;
      const isFinished =
        !isCancelled &&
        (order.orderStatus === OrderStatus.Delivered ||
          order.orderStatus === OrderStatus.Concluded) &&
        isPaid;

      return {
        id: order.id,
        createdAt: order.createdAT,
        deliveryType: order.deliveryType,
        orderStatus: order.orderStatus,
        isPaid,
        isOpen: !isFinished && !isCancelled,
        isCancelled,
        deliveryManName: order.deliveryMan?.fullName ?? null,
        transactionType: transaction?.transactionType ?? null,
        address: order.orderAddress
          ? {
              typeAddress: order.orderAddress.typeAddress,
              address: order.orderAddress.address,
              number: order.orderAddress.number,
              district: order.orderAddress.district,
            }
          : null,
        products: (order.orderDetails ?? []).map((detail) => ({
          id: detail.id,
          productName: detail.productName,
          quantity: detail.quantity,
          totalPrice: Number(detail.totalPrice),
        })),
        freightPrice: Number(transaction?.freightPrice ?? 0),
        totalPrice: Number(transaction?.totalPrice ?? 0),
      };
    });
  }

  // Lista completa de vendas (qualquer status/forma de pagamento) pra aba
  // "Vendas": método de pagamento, comprador (identificado ou anônimo),
  // se foi delivery e os produtos comprados.
  async findAllSells() {
    const orders = await this.repository.findAllOrdersWithDetails();

    return orders.map((order) => {
      const transaction = order.orderTransaction?.[0];
      const isAnonymous = !order.client;
      const buyerName =
        order.client?.fullName ?? order.orderAddress?.recipientName ?? 'Anônimo';

      const totalPrice = Number(transaction?.totalPrice ?? 0);
      const feeAmount = Number(transaction?.feeAmount ?? 0);
      const totalCost = (order.orderDetails ?? []).reduce(
        (sum, detail) => sum + Number(detail.totalCost ?? 0),
        0,
      );

      return {
        id: order.id,
        createdAt: order.createdAT,
        deliveryType: order.deliveryType,
        orderStatus: order.orderStatus,
        isPaid: transaction?.isPaid ?? false,
        paidDate: transaction?.paidDate ?? null,
        transactionType: transaction?.transactionType ?? null,
        workDayId: order.workDayId,
        buyer: {
          clientId: order.clientId,
          name: buyerName,
          isAnonymous,
        },
        deliveryMan: order.deliveryMan
          ? { id: order.deliveryMan.id, fullName: order.deliveryMan.fullName }
          : null,
        address: order.orderAddress
          ? {
              recipientName: order.orderAddress.recipientName,
              typeAddress: order.orderAddress.typeAddress,
              address: order.orderAddress.address,
              number: order.orderAddress.number,
              district: order.orderAddress.district,
              complement: order.orderAddress.complement,
              zipCode: order.orderAddress.zipCode,
            }
          : null,
        products: (order.orderDetails ?? []).map((detail) => ({
          id: detail.id,
          productId: detail.productId,
          productName: detail.productName,
          quantity: detail.quantity,
          unityPrice: Number(detail.unityPrice),
          totalPrice: Number(detail.totalPrice),
        })),
        totalProductPrice: Number(transaction?.totalProductPrice ?? 0),
        freightPrice: Number(transaction?.freightPrice ?? 0),
        interestAmount: Number(transaction?.interestAmount ?? 0),
        totalPrice,
        // Taxa da maquininha e o que de fato entra no caixa.
        feePercent: Number(transaction?.feePercent ?? 0),
        feeAmount,
        netPrice: totalPrice - feeAmount,
        // Custo das mercadorias que saíram (landedUnitCost dos lotes
        // baixados). O frete não tem custo lançado, então entra inteiro
        // como receita — o lucro abaixo carrega isso.
        totalCost,
        profit: totalPrice - feeAmount - totalCost,
      };
    });
  }

  // Edita uma venda já registrada: método de pagamento, comprador (pode
  // tornar anônima ou reatribuir), destinatário/endereço (delivery) e
  // quantidade dos produtos (ajustando o estoque conforme a diferença).
  async updateSale(orderId: string, dto: UpdateSaleDto) {
    return this.repository.runInTransaction(async (tx) => {
      const order = await this.repository.findOrderForEdit(orderId, tx);
      if (!order) {
        throw new NotFoundException('Venda não encontrada.');
      }

      if (dto.items) {
        for (const item of dto.items) {
          const detail = order.orderDetails.find(
            (d) => d.id === item.orderDetailId,
          );
          if (!detail) {
            throw new NotFoundException(
              `O item ${item.orderDetailId} não pertence a essa venda.`,
            );
          }

          const delta = item.quantity - detail.quantity;
          if (delta === 0) continue;

          if (delta > 0) {
            const stockEntries =
              await this.repository.findAvailableStockEntriesByProductId(
                detail.productId,
                tx,
              );
            const totalAvailable = stockEntries.reduce(
              (sum, entry) => sum + entry.quantityOnStock,
              0,
            );
            if (totalAvailable < delta) {
              throw new BadRequestException(
                `Estoque insuficiente para aumentar a quantidade de ${detail.productName}.`,
              );
            }

            let remaining = delta;
            let addedCost = new Prisma.Decimal(0);
            for (const entry of stockEntries) {
              if (remaining <= 0) break;
              const take = Math.min(entry.quantityOnStock, remaining);
              await this.repository.updateStockEntryQuantity(
                entry.id,
                entry.quantityOnStock - take,
                tx,
              );
              addedCost = addedCost.add(entry.landedUnitCost.mul(take));
              remaining -= take;
            }

            const newTotalCost = (detail.totalCost ?? new Prisma.Decimal(0)).add(
              addedCost,
            );
            const newTotalPrice = detail.unityPrice.mul(item.quantity);
            await this.repository.updateOrderDetail(
              detail.id,
              item.quantity,
              newTotalPrice,
              newTotalCost,
              tx,
            );
          } else {
            const returnQty = -delta;
            await this.repository.restockProduct(
              detail.productId,
              returnQty,
              tx,
            );

            if (item.quantity === 0) {
              await this.repository.deleteOrderDetail(detail.id, tx);
            } else {
              const unitCost = detail.quantity > 0
                ? (detail.totalCost ?? new Prisma.Decimal(0)).div(detail.quantity)
                : new Prisma.Decimal(0);
              const newTotalCost = unitCost.mul(item.quantity);
              const newTotalPrice = detail.unityPrice.mul(item.quantity);
              await this.repository.updateOrderDetail(
                detail.id,
                item.quantity,
                newTotalPrice,
                newTotalCost,
                tx,
              );
            }
          }
        }
      }

      const remainingDetails = await this.repository.findOrderDetailsByOrderId(
        orderId,
        tx,
      );
      if (remainingDetails.length === 0) {
        throw new BadRequestException(
          'A venda precisa ter pelo menos um produto.',
        );
      }

      const transaction = order.orderTransaction[0];
      if (transaction) {
        const totalProductPrice = remainingDetails.reduce(
          (sum, detail) => sum.add(detail.totalPrice),
          new Prisma.Decimal(0),
        );
        const totalPrice = totalProductPrice
          .add(transaction.freightPrice)
          .add(transaction.interestAmount);

        // Mudou o total ou a forma de pagamento -> a taxa muda junto. A
        // maquininha cobra sobre o valor realmente cobrado, então manter a
        // taxa antiga deixaria o líquido mentindo.
        const transactionType =
          dto.transactionType ?? transaction.transactionType;
        const settings = await this.settingsService.getSettings();
        const { feePercent, feeAmount } = calculatePaymentFee(
          totalPrice,
          transactionType,
          settings,
        );

        await this.repository.updateOrderTransaction(
          transaction.id,
          {
            transactionType,
            totalProductPrice,
            totalPrice,
            feePercent,
            feeAmount,
          },
          tx,
        );
      }

      if (dto.clientId !== undefined) {
        if (dto.clientId) {
          await this.userService.findUserById(dto.clientId);
        }
        await this.repository.updateOrderClient(orderId, dto.clientId, tx);
      }

      if (
        order.deliveryType === DeliveryType.Delivery &&
        (dto.recipientName !== undefined ||
          dto.typeAddress !== undefined ||
          dto.address !== undefined ||
          dto.number !== undefined ||
          dto.district !== undefined ||
          dto.complement !== undefined ||
          dto.zipCode !== undefined)
      ) {
        await this.repository.updateOrderAddress(
          orderId,
          {
            recipientName: dto.recipientName,
            typeAddress: dto.typeAddress,
            address: dto.address,
            number: dto.number,
            district: dto.district,
            complement: dto.complement,
            zipCode: dto.zipCode,
          },
          tx,
        );
      }

      return { updated: true };
    });
  }

  // Pedidos de delivery que passam pelo Kanban (recebido -> preparação ->
  // pronto -> a caminho -> entregue). Vendas de balcão nunca aparecem aqui.
  async getKanbanOrders(todayOnly = false) {
    // No Resumo o quadro e do DIA: a coluna "Entregue" mostra so o que foi
    // entregue no dia de trabalho aberto. Na aba Pedidos continua sendo o
    // historico inteiro.
    const workDayId = todayOnly
      ? await this.workDayService.findOpenWorkDayId()
      : undefined;

    const orders = await this.repository.findKanbanOrders(workDayId);

    return orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAT,
      updatedAt: order.updateAt,
      orderStatus: order.orderStatus,
      orderSource: order.orderSource,
      buyerName:
        order.client?.fullName ?? order.orderAddress?.recipientName ?? 'Anônimo',
      address: order.orderAddress
        ? {
            address: order.orderAddress.address,
            number: order.orderAddress.number,
            district: order.orderAddress.district,
            complement: order.orderAddress.complement,
            zipCode: order.orderAddress.zipCode,
            latitude: order.orderAddress.latitude,
            longitude: order.orderAddress.longitude,
          }
        : null,
      deliveryMan: order.deliveryMan
        ? { id: order.deliveryMan.id, fullName: order.deliveryMan.fullName }
        : null,
      products: (order.orderDetails ?? []).map((detail) => ({
        id: detail.id,
        productName: detail.productName,
        quantity: detail.quantity,
        checked: detail.checked,
      })),
    }));
  }

  // "Recebido" -> "Em preparação" (ação manual do balcão).
  async startPreparing(orderId: string) {
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    if (order.orderStatus !== OrderStatus.Confirmed) {
      throw new BadRequestException(
        'Esse pedido não está na etapa "Recebido".',
      );
    }
    await this.repository.updateOrderStatus(orderId, OrderStatus.Preparing);
    return { updated: true };
  }

  // Marca/desmarca um item do checklist de separação. Quando todos os itens
  // ficam marcados, o pedido avança automaticamente pra "Pronto"; se algum
  // item for desmarcado depois, ele volta pra "Em preparação".
  async toggleChecklistItem(orderId: string, dto: ToggleChecklistDto) {
    return this.repository.runInTransaction(async (tx) => {
      const detail = await this.repository.findOrderDetailById(
        dto.orderDetailId,
        tx,
      );
      if (!detail || detail.orderId !== orderId) {
        throw new NotFoundException(
          'Esse item não pertence a esse pedido.',
        );
      }

      await this.repository.updateOrderDetailChecked(
        dto.orderDetailId,
        dto.checked,
        tx,
      );

      const order = await this.repository.findOrderForEdit(orderId, tx);
      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      const allChecked = order.orderDetails.every((d) =>
        d.id === dto.orderDetailId ? dto.checked : d.checked,
      );

      if (allChecked && order.orderStatus === OrderStatus.Preparing) {
        await this.repository.updateOrderStatus(
          orderId,
          OrderStatus.ReadyToPickup,
          tx,
        );
      } else if (!allChecked && order.orderStatus === OrderStatus.ReadyToPickup) {
        await this.repository.updateOrderStatus(
          orderId,
          OrderStatus.Preparing,
          tx,
        );
      }

      return { updated: true };
    });
  }

  // "Pronto" -> "A caminho": atribui o motoboy e já avança a etapa. Um
  // motoboy pode carregar mais de um pedido ao mesmo tempo.
  async assignDriver(orderId: string, dto: AssignDriverDto) {
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    if (order.orderStatus !== OrderStatus.ReadyToPickup) {
      throw new BadRequestException('Esse pedido ainda não está pronto.');
    }

    await this.userService.ensureDeliveryMan(dto.deliveryManId);
    await this.repository.assignOrderDriver(orderId, dto.deliveryManId);
    return { updated: true };
  }

  // Resolve as coordenadas dos pedidos ativos que ainda não têm, pra que
  // apareçam no mapa de entregas. Sem retryFailed é idempotente: endereço
  // já processado (mesmo sem sucesso) não é consultado de novo.
  async geocodePendingOrders(retryFailed = false) {
    const pending =
      await this.repository.findAddressesNeedingGeocode(retryFailed);
    if (pending.length === 0) return { geocoded: 0, failed: 0, pending: 0 };

    const { city, state } = await this.settingsService.getSettings();

    let geocoded = 0;
    let failed = 0;

    await this.geocodingService.geocodeMany(
      pending.map((item) => ({
        id: item.id,
        queries: buildGeocodeQueries(item, city, state),
      })),
      async (addressId, coordinates) => {
        await this.repository.updateAddressCoordinates(
          addressId,
          coordinates?.latitude ?? null,
          coordinates?.longitude ?? null,
        );
        if (coordinates) geocoded += 1;
        else failed += 1;
      },
    );

    return { geocoded, failed, pending: pending.length };
  }

  // Centro do mapa de entregas: a cidade configurada nas Configurações.
  // Se o geocoding falhar, o mapa se vira centralizando pelos pedidos.
  async getMapCenter() {
    const { city, state } = await this.settingsService.getSettings();
    const coordinates = await this.geocodingService.geocodeCity(city, state);

    return {
      city,
      state,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
    };
  }

  // Etapa anterior de cada status, pra permitir voltar manualmente.
  private static readonly PREVIOUS_STATUS: Partial<
    Record<OrderStatus, OrderStatus>
  > = {
    [OrderStatus.Preparing]: OrderStatus.Confirmed,
    [OrderStatus.ReadyToPickup]: OrderStatus.Preparing,
    [OrderStatus.OutForDelivery]: OrderStatus.ReadyToPickup,
    [OrderStatus.Delivered]: OrderStatus.OutForDelivery,
  };

  // Volta o pedido pra etapa anterior do Kanban (corrige clique errado, etc).
  async revertOrderStatus(orderId: string) {
    return this.repository.runInTransaction(async (tx) => {
      const order = await this.repository.findOrderById(orderId, tx);
      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      const previous = OrderService.PREVIOUS_STATUS[order.orderStatus];
      if (!previous) {
        throw new BadRequestException('Esse pedido já está na primeira etapa.');
      }

      // Sair de "Entregue" desfaz o recebimento: um pedido que não foi
      // entregue não pode continuar contando como dinheiro em caixa.
      if (order.orderStatus === OrderStatus.Delivered) {
        await this.repository.unmarkOrderPaid(orderId, tx);
        await this.revertOrderPoints(orderId, tx);
      }

      const clearDriver = order.orderStatus === OrderStatus.OutForDelivery;
      await this.repository.revertOrderStatus(
        orderId,
        previous,
        clearDriver,
        tx,
      );
      return { updated: true };
    });
  }

  /**
   * Cancela um pedido do Kanban.
   *
   * Cancelar não é só trocar o status: a mercadoria foi baixada do
   * estoque quando o pedido nasceu, então ela precisa voltar — senão o
   * inventário passa a mentir a cada cancelamento.
   *
   * Um pedido já entregue não pode ser cancelado por aqui: se a
   * mercadoria está na casa do cliente, devolver ao estoque criaria
   * produto que não existe na prateleira.
   */
  async cancelOrder(orderId: string) {
    return this.repository.runInTransaction(async (tx) => {
      const order = await this.repository.findOrderForEdit(orderId, tx);
      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }

      if (order.orderStatus === OrderStatus.Cancelled) {
        throw new BadRequestException('Esse pedido já está cancelado.');
      }

      if (
        order.orderStatus === OrderStatus.Delivered ||
        order.orderStatus === OrderStatus.Concluded
      ) {
        throw new BadRequestException(
          'Pedido já entregue não pode ser cancelado. Use o histórico de vendas para corrigir.',
        );
      }

      // Devolve cada linha ao estoque, na mesma ordem de lote (FIFO) em
      // que saiu.
      for (const detail of order.orderDetails ?? []) {
        if (detail.quantity > 0) {
          await this.repository.restockProduct(
            detail.productId,
            detail.quantity,
            tx,
          );
        }
      }

      // Produto que tinha zerado volta a ficar disponível na vitrine.
      const productIds = Array.from(
        new Set((order.orderDetails ?? []).map((detail) => detail.productId)),
      );
      if (productIds.length > 0) {
        await this.catalogService.updateProductsAvailability(
          productIds,
          true,
          tx,
        );
      }

      // Pedido cancelado não pode continuar contando como dinheiro em
      // caixa nem como dívida em aberto na notinha.
      await this.repository.unmarkOrderPaid(orderId, tx);
      await this.revertOrderPoints(orderId, tx, { refundRedemption: true });

      await this.repository.cancelOrder(orderId, tx);

      return { cancelled: true, restockedLines: (order.orderDetails ?? []).length };
    });
  }

  /**
   * Desfaz o que a pontuação fez por um pedido que deixou de valer.
   *
   * Duas coisas independentes: os pontos GANHOS somem (o pagamento que os
   * gerou não existe mais) e os pontos USADOS como desconto voltam pro
   * cliente — ele pagou com eles por uma mercadoria que não recebeu.
   *
   * Voltar atrás no Kanban desfaz só o ganho: a mercadoria continua com o
   * pedido, e devolver o desconto ali deixaria o cliente com os pontos e
   * com o produto.
   */
  private async revertOrderPoints(
    orderId: string,
    tx: Prisma.TransactionClient,
    options: { refundRedemption?: boolean } = {},
  ) {
    const order = await this.repository.findOrderForEdit(orderId, tx);
    if (!order) return;

    for (const transaction of order.orderTransaction ?? []) {
      await this.pointsService.revertForTransaction(tx, transaction.id);

      if (
        options.refundRedemption &&
        order.clientId &&
        new Prisma.Decimal(transaction.pointsRedeemed).greaterThan(0)
      ) {
        await this.pointsService.refundRedemption(
          tx,
          orderId,
          order.clientId,
          transaction.pointsRedeemed,
        );
      }
    }
  }

  // "A caminho" -> "Entregue". Concluir a entrega é o momento em que o
  // dinheiro entra: sem isso o pedido ficava eternamente como não pago e
  // o faturamento de delivery nunca aparecia no Resumo/Financeiro, que só
  // contam transações pagas.
  async markDelivered(orderId: string) {
    return this.repository.runInTransaction(async (tx) => {
      const order = await this.repository.findOrderForEdit(orderId, tx);
      if (!order) {
        throw new NotFoundException('Pedido não encontrado.');
      }
      if (order.orderStatus !== OrderStatus.OutForDelivery) {
        throw new BadRequestException('Esse pedido ainda não está a caminho.');
      }

      // Notinha é a exceção: a mercadoria chega, mas a conta continua em
      // aberto até o cliente fechá-la (closeTab). Marcar como paga aqui
      // faria a dívida sumir sem ninguém ter pago.
      const isOnTheBill = (order.orderTransaction ?? []).some(
        (transaction) =>
          transaction.transactionType === TransactionType.OnTheBill,
      );

      // Pedido que nasceu sem dia de trabalho (loja fechada) entra no dia
      // atual ao ser concluído. Se já tem um, o dia é preservado — mover
      // faturamento entre dias por causa de um clique seria pior.
      const workDayId =
        order.workDayId ?? (await this.workDayService.findOpenWorkDayId());

      // Entrega concluída é o momento do recebimento, então é aqui que a
      // taxa da maquininha é congelada — com a alíquota de agora, não com
      // a que valia quando o pedido foi criado.
      const settings = await this.settingsService.getSettings();
      const fees = (order.orderTransaction ?? []).map((transaction) => {
        const { feePercent, feeAmount } = calculatePaymentFee(
          transaction.totalPrice,
          transaction.transactionType,
          settings,
        );
        return { id: transaction.id, feePercent, feeAmount };
      });

      await this.repository.markOrderDelivered(
        orderId,
        workDayId,
        !isOnTheBill,
        fees,
        tx,
      );

      // Notinha entregue continua sem pontuar: a conta segue em aberto, e
      // pontuar aqui premiaria uma promessa de pagamento.
      if (!isOnTheBill) {
        const paidAt = new Date();
        for (const transaction of order.orderTransaction ?? []) {
          await this.pointsService.awardForPayment(tx, {
            orderId,
            orderTransactionId: transaction.id,
            clientId: order.clientId,
            transactionType: transaction.transactionType,
            productBasis: new Prisma.Decimal(transaction.totalProductPrice).sub(
              transaction.pointsDiscountAmount,
            ),
            openedAt: order.createdAT,
            paidAt,
          });
        }
      }

      return { updated: true };
    });
  }
}
