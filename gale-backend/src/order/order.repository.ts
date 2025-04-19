import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';
import { CreateOrderDetailsDto, CreateOrderRequestDto, CreateOrderTransactionDto } from './dto/create-order.dto';

@Injectable()
export class OrderRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async createOrderRequest(data: CreateOrderRequestDto, tx?: Prisma.TransactionClient){
    const client = tx ?? this.prisma;
    return client.orderRequest.create({ data });
  }

  async createOrderDetails(data: CreateOrderDetailsDto, tx?: Prisma.TransactionClient){
    const client = tx ?? this.prisma;
    return client.orderDetails.create({ data });
  }

  async createOrderTransaction(data: CreateOrderTransactionDto, tx?: Prisma.TransactionClient){
    const client = tx ?? this.prisma;
    return client.orderTransaction.create({ data });
  }

}