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
      orderBy: { createdAT: 'asc' },
    });
  }

  async closeTabOrder(
    orderId: string,
    workDayId: string | null,
    transactionType: Prisma.OrderTransactionUpdateManyMutationInput['transactionType'],
    interestAmount: Prisma.Decimal,
    tx: Prisma.TransactionClient,
  ) {
    await tx.orderTransaction.updateMany({
      where: { orderId },
      data: {
        transactionType,
        isPaid: true,
        paidDate: new Date(),
        interestAmount,
        totalPrice: { increment: interestAmount },
      },
    });
    return tx.order.update({
      where: { id: orderId },
      data: { orderStatus: 'Concluded', workDayId },
    });
  }
}
