import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';
import {
  CreateOrderDetailsDto,
  CreateOrderDto,
  CreateOrderTransactionDto,
} from './dto/create-order.dto';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async createOrder(
    data: Prisma.OrderCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.order.create({ data });
  }

  async createOrderDetails(
    data: Prisma.OrderDetailCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.orderDetail.create({ data });
  }

  async createOrderTransaction(
    data: Prisma.OrderTransactionCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.orderTransaction.create({ data });
  }

  async createOrderAddress(
    data: Prisma.OrderAddressCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.orderAddress.create({ data });
  }

  // Buscar lotes de estoque disponíveis por produto, mais antigo primeiro (FIFO)
  async findAvailableStockEntriesByProductId(
    productId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.stockEntryDetail.findMany({
      where: {
        productId,
        quantityOnStock: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStockEntryQuantity(
    stockEntryDetailId: string,
    newQuantity: number,
    tx: Prisma.TransactionClient,
  ) {
    return tx.stockEntryDetail.update({
      where: { id: stockEntryDetailId },
      data: { quantityOnStock: newQuantity },
    });
  }

  // Notinhas em aberto: pedidos de balcão pagos "OnTheBill" que ainda não
  // foram fechados (isPaid: false), agrupáveis por cliente.
  async findOpenTabOrders() {
    return this.prisma.order.findMany({
      where: {
        clientId: { not: null },
        orderTransaction: { some: { transactionType: 'OnTheBill', isPaid: false } },
      },
      include: {
        client: { select: { id: true, fullName: true } },
        orderDetails: true,
        orderTransaction: true,
      },
      orderBy: { createdAT: 'asc' },
    });
  }

  async findOpenTabOrdersByClient(
    clientId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.order.findMany({
      where: {
        clientId,
        orderTransaction: { some: { transactionType: 'OnTheBill', isPaid: false } },
      },
      // As transações vêm junto porque o fechamento precisa recalcular a
      // taxa de recebimento sobre o total final (já com juros). O filtro
      // repete a condição do `where` de propósito: ali ele escolhe QUAIS
      // pedidos entram, aqui evita arrastar junto uma transação do mesmo
      // pedido que já estivesse quitada.
      include: {
        orderTransaction: {
          where: { transactionType: 'OnTheBill', isPaid: false },
        },
      },
      orderBy: { createdAT: 'asc' },
    });
  }

  // Fecha um pedido de notinha. Cada transação é atualizada pelo próprio
  // id (e não em bloco por orderId) porque juros e taxa são valores
  // calculados individualmente pelo service — aplicar o mesmo montante a
  // várias transações do pedido cobraria a mais.
  async closeTabOrder(
    orderId: string,
    workDayId: string | null,
    transactionType: Prisma.OrderTransactionUpdateInput['transactionType'],
    transactions: {
      id: string;
      totalPrice: Prisma.Decimal;
      interestAmount: Prisma.Decimal;
      feePercent: Prisma.Decimal;
      feeAmount: Prisma.Decimal;
    }[],
    tx: Prisma.TransactionClient,
  ) {
    const paidDate = new Date();

    for (const transaction of transactions) {
      await tx.orderTransaction.update({
        where: { id: transaction.id },
        data: {
          transactionType,
          isPaid: true,
          paidDate,
          interestAmount: transaction.interestAmount,
          totalPrice: transaction.totalPrice,
          feePercent: transaction.feePercent,
          feeAmount: transaction.feeAmount,
        },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { orderStatus: 'Concluded', workDayId },
    });
  }

  // Pedidos de delivery que passam pelo Kanban. Os feitos pela "Nova Venda"
  // do admin/vendedor (orderSource = Call) entram direto em "Preparação"
  // (ver order.service.createOrderByShopper); os demais entram em
  // "Recebido" — mas todos passam pelas mesmas etapas daqui em diante.
  /**
   * Pedidos do Kanban.
   *
   * `workDayId` recorta APENAS a coluna "Entregue": ela e um historico e,
   * sem recorte, acumula tudo que ja foi entregue desde sempre.
   *
   * As colunas ativas ficam de fora do filtro de proposito. Um pedido que
   * entrou ontem e ainda esta em preparo tem que continuar aparecendo -
   * some-lo do quadro seria pior do que o historico crescer.
   */
  async findKanbanOrders(workDayId?: string | null) {
    const activeStatuses: Prisma.EnumOrderStatusFilter['in'] = [
      'Confirmed',
      'Preparing',
      'ReadyToPickup',
      'OutForDelivery',
    ];

    return this.prisma.order.findMany({
      where: {
        deliveryType: 'Delivery',
        ...(workDayId === undefined
          ? {
              orderStatus: { in: [...activeStatuses, 'Delivered'] },
            }
          : {
              OR: [
                { orderStatus: { in: activeStatuses } },
                // workDayId null (loja fechada) nao casa com pedido nenhum,
                // entao a coluna "Entregue" fica vazia - que e o correto:
                // sem dia aberto, nao ha entregas "de hoje".
                { orderStatus: 'Delivered', workDayId },
              ],
            }),
      },
      include: {
        client: { select: { id: true, fullName: true } },
        deliveryMan: { select: { id: true, fullName: true } },
        orderDetails: true,
        orderAddress: true,
      },
    });
  }

  // Endereços de pedidos ativos do Kanban que ainda não passaram pelo
  // geocoding. Entregues ficam de fora: já saíram do mapa.
  // Com retryFailed, inclui também os que já tentaram e não resolveram —
  // usado quando o usuário corrige um endereço e pede pra tentar de novo.
  async findAddressesNeedingGeocode(retryFailed = false) {
    return this.prisma.orderAddress.findMany({
      where: {
        ...(retryFailed ? { latitude: null } : { geocodedAt: null }),
        order: {
          deliveryType: 'Delivery',
          orderStatus: {
            in: ['Confirmed', 'Preparing', 'ReadyToPickup', 'OutForDelivery'],
          },
        },
      },
      select: {
        id: true,
        typeAddress: true,
        address: true,
        number: true,
        district: true,
        zipCode: true,
      },
    });
  }

  async updateAddressCoordinates(
    addressId: string,
    latitude: number | null,
    longitude: number | null,
  ) {
    return this.prisma.orderAddress.update({
      where: { id: addressId },
      data: { latitude, longitude, geocodedAt: new Date() },
    });
  }

  async findOrderById(orderId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.order.findUnique({ where: { id: orderId } });
  }

  async updateOrderStatus(
    orderId: string,
    orderStatus: Prisma.OrderUpdateInput['orderStatus'],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.order.update({ where: { id: orderId }, data: { orderStatus } });
  }

  // Volta o pedido pra etapa anterior do Kanban. Ao sair de "A caminho",
  // desatribui o motoboy (não faz sentido continuar atribuído se o pedido
  // nem está pronto pra sair mais).
  async revertOrderStatus(
    orderId: string,
    orderStatus: Prisma.OrderUpdateInput['orderStatus'],
    clearDriver: boolean,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.order.update({
      where: { id: orderId },
      data: {
        orderStatus,
        ...(clearDriver && { deliveryMan: { disconnect: true } }),
      },
    });
  }

  // Entrega concluída: marca o pedido como entregue e o pagamento como
  // recebido. workDayId só é informado quando o pedido ainda não tinha um.
  async markOrderDelivered(
    orderId: string,
    workDayId: string | null,
    markPaid: boolean,
    fees: { id: string; feePercent: Prisma.Decimal; feeAmount: Prisma.Decimal }[],
    tx: Prisma.TransactionClient,
  ) {
    if (markPaid) {
      const paidDate = new Date();
      // A alíquota é congelada agora, no instante em que o dinheiro entra —
      // não na criação do pedido, que pode ter sido dias antes.
      for (const fee of fees) {
        await tx.orderTransaction.update({
          where: { id: fee.id },
          data: {
            isPaid: true,
            paidDate,
            feePercent: fee.feePercent,
            feeAmount: fee.feeAmount,
          },
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'Delivered',
        ...(workDayId ? { workDayId } : {}),
      },
    });
  }

  // Cancela o pedido e solta o motoboy: ele não tem mais nada a entregar
  // ali, e deixar atribuído sujaria o agrupamento por entregador.
  async cancelOrder(orderId: string, tx: Prisma.TransactionClient) {
    return tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'Cancelled',
        deliveryMan: { disconnect: true },
      },
    });
  }

  // Desfaz o recebimento quando a entrega volta atrás no Kanban.
  async unmarkOrderPaid(orderId: string, tx: Prisma.TransactionClient) {
    return tx.orderTransaction.updateMany({
      where: { orderId },
      data: { isPaid: false, paidDate: null },
    });
  }

  async findOrderDetailById(orderDetailId: string, tx: Prisma.TransactionClient) {
    return tx.orderDetail.findUnique({ where: { id: orderDetailId } });
  }

  async updateOrderDetailChecked(
    orderDetailId: string,
    checked: boolean,
    tx: Prisma.TransactionClient,
  ) {
    return tx.orderDetail.update({ where: { id: orderDetailId }, data: { checked } });
  }

  async assignOrderDriver(
    orderId: string,
    deliveryManId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.order.update({
      where: { id: orderId },
      data: {
        deliveryMan: { connect: { id: deliveryManId } },
        orderStatus: 'OutForDelivery',
      },
    });
  }

  // Todas as vendas, com todos os detalhes, pra aba "Vendas".
  async findAllOrdersWithDetails() {
    return this.prisma.order.findMany({
      include: {
        client: { select: { id: true, fullName: true } },
        deliveryMan: { select: { id: true, fullName: true } },
        orderDetails: true,
        orderTransaction: true,
        orderAddress: true,
      },
      orderBy: { createdAT: 'desc' },
    });
  }

  /**
   * Pedidos de delivery do cliente que ainda não chegaram ao fim.
   *
   * A fronteira é "Entregue": a partir dali o pedido sai da fila, tendo
   * sido pago ou não. Cancelado e entrega falha também não contam — são
   * finais, só que ruins.
   */
  async findOpenDeliveryOrdersByClient(clientId: string) {
    return this.prisma.order.findMany({
      where: {
        clientId,
        deliveryType: 'Delivery',
        orderStatus: {
          in: ['Confirmed', 'Preparing', 'ReadyToPickup', 'OutForDelivery'],
        },
      },
      include: { orderDetails: true, orderTransaction: true },
      orderBy: { createdAT: 'asc' },
    });
  }

  // Pedidos de um cliente específico, do mais novo pro mais antigo. É o
  // que alimenta "Meus pedidos" na vitrine.
  async findOrdersByClient(clientId: string) {
    return this.prisma.order.findMany({
      where: { clientId },
      include: {
        orderDetails: true,
        orderTransaction: true,
        orderAddress: true,
        deliveryMan: { select: { fullName: true } },
      },
      orderBy: { createdAT: 'desc' },
    });
  }

  async findOrderForEdit(orderId: string, tx: Prisma.TransactionClient) {
    return tx.order.findUnique({
      where: { id: orderId },
      include: { orderDetails: true, orderTransaction: true },
    });
  }

  async findOrderDetailsByOrderId(
    orderId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.orderDetail.findMany({ where: { orderId } });
  }

  async updateOrderDetail(
    id: string,
    quantity: number,
    totalPrice: Prisma.Decimal,
    totalCost: Prisma.Decimal,
    tx: Prisma.TransactionClient,
  ) {
    return tx.orderDetail.update({
      where: { id },
      data: { quantity, totalPrice, totalCost },
    });
  }

  async deleteOrderDetail(id: string, tx: Prisma.TransactionClient) {
    return tx.orderDetail.delete({ where: { id } });
  }

  // Devolve quantidade ao estoque (lotes mais antigos primeiro, sem passar
  // do tamanho original de cada lote) — usado ao diminuir/remover um item
  // de uma venda já registrada.
  async restockProduct(
    productId: string,
    quantity: number,
    tx: Prisma.TransactionClient,
  ) {
    const entries = await tx.stockEntryDetail.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });

    let remaining = quantity;
    for (const entry of entries) {
      if (remaining <= 0) break;
      const room = entry.initialQuantity - entry.quantityOnStock;
      if (room <= 0) continue;
      const give = Math.min(room, remaining);
      await tx.stockEntryDetail.update({
        where: { id: entry.id },
        data: { quantityOnStock: entry.quantityOnStock + give },
      });
      remaining -= give;
    }

    // Sobra improvável (por conservação de estoque), mas devolve no lote
    // mais antigo mesmo assim, pra não perder a quantidade.
    if (remaining > 0 && entries.length > 0) {
      await tx.stockEntryDetail.update({
        where: { id: entries[0].id },
        data: { quantityOnStock: { increment: remaining } },
      });
    }
  }

  async updateOrderTransaction(
    id: string,
    data: Prisma.OrderTransactionUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.orderTransaction.update({ where: { id }, data });
  }

  async updateOrderClient(
    orderId: string,
    clientId: string | null,
    tx: Prisma.TransactionClient,
  ) {
    return tx.order.update({
      where: { id: orderId },
      data: {
        client: clientId
          ? { connect: { id: clientId } }
          : { disconnect: true },
      },
    });
  }

  async updateOrderAddress(
    orderId: string,
    data: {
      recipientName?: string;
      typeAddress?: Prisma.OrderAddressUpdateInput['typeAddress'];
      address?: string;
      number?: string;
      district?: string;
      complement?: string;
      zipCode?: string;
    },
    tx: Prisma.TransactionClient,
  ) {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    );
    if (Object.keys(cleaned).length === 0) return;

    return tx.orderAddress.update({ where: { orderId }, data: cleaned });
  }
}
