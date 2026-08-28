import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CatalogService } from 'src/catalog/catalog.service';
import { CreateFullOrderDto, CreateOrderDto } from './dto/create-order.dto';
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

@Injectable()
export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly catalogService: CatalogService,
    private readonly userService: UserService,
    private readonly settingsService: SettingsService,
    private readonly workDayService: WorkDayService,
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
            order.orderStatus = OrderStatus.Confirmed;
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
        const totalPrice = totalProductPrice.add(freightPrice);

        const transactionPayload = {
          order: { connect: { id: orderCreated.id } },
          transactionType: transactionType as TransactionType,
          totalProductPrice,
          freightPrice,
          totalPrice,
          isPaid,
          paidDate,
        };

        await this.repository.createOrderTransaction(transactionPayload, tx);

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

      for (const [index, order] of orders.entries()) {
        await this.repository.closeTabOrder(
          order.id,
          workDayId,
          transactionType,
          index === 0 ? interestDecimal : new Prisma.Decimal(0),
          tx,
        );
      }

      return { closedOrders: orders.length };
    });
  }
}
