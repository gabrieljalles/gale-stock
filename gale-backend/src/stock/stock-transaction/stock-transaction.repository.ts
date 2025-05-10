import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Supplier, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class StockTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async findUniqueTransaction(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.stockTransaction.findUnique({ where: { id } });
  }

  async findUniqueInstallment(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.stockTransactionInstallment.findUnique({ where: { id } });
  }

  async findAllInstallmentsByTransaction(
    transactionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    return client.stockTransactionInstallment.findMany({
      where: { stockTransactionId: transactionId },
    });
  }

  async findAllEntryDetailsByTransaction(
    transactionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    return client.stockEntryDetail.findMany({
      where: { stockTransactionId: transactionId },
    });
  }

  async createTransaction(
    data: Prisma.StockTransactionCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.stockTransaction.create({ data });
  }

  async createInstallments(
    installments: Array<{
      stockTransactionId: string;
      installmentNumber: number;
      dueDate: Date;
      fragmentCost: number;
    }>,
    tx: Prisma.TransactionClient,
  ) {
    return Promise.all(
      installments.map((installment) =>
        tx.stockTransactionInstallment.create({
          data: installment,
        }),
      ),
    );
  }

  async createStockEntryDetails(
    details: Array<{
      stockTransactionId: string;
      productId: string;
      baseUnitCost: number;
      landedUnitCost: Decimal;
      totalProductCost: number;
      initialQuantity: number;
      quantityOnStock: number;
      validityDate: Date;
    }>,
    tx: Prisma.TransactionClient,
  ) {
    return Promise.all(
      details.map((detail) =>
        tx.stockEntryDetail.create({
          data: detail,
        }),
      ),
    );
  }

  async updateInstallment(
    id: string,
    data: Partial<{ paidDate: Date }>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.stockTransactionInstallment.update({
      where: { id },
      data,
    });
  }

  async deleteTransaction(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.stockTransaction.delete({
      where: { id },
    });
  }
}
