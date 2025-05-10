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
}
