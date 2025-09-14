import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLostEntryDto } from './dto/create-lost-entry.dto';

@Injectable()
export class LostEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async createLoss(
    data: {
      productId: string;
      stockEntryDetailId: string;
      quantity: number;
      reasonLoss: any;
      note?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.lostEntry.create({ data });
  }

  async deleteLoss(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.lostEntry.delete({ where: { id } });
  }

  async findLossById(id: string) {
    return this.prisma.lostEntry.findUnique({ where: { id } });
  }

  async findAllLosses() {
    return this.prisma.lostEntry.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imgUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Buscar StockEntryDetail mais antigo por productId
  async findOldestStockEntryByProductId(
    productId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.stockEntryDetail.findFirst({
      where: {
        productId,
        quantityOnStock: { gt: 0 }, // Apenas com estoque disponível
      },
      orderBy: { createdAt: 'asc' }, // Mais antigo primeiro
    });
  }

  // Buscar múltiplas StockEntryDetail por productId (para distribuir perdas)
  async findMultipleStockEntriesByProductId(
    productId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.stockEntryDetail.findMany({
      where: {
        productId,
        quantityOnStock: { gt: 0 }, // Apenas com estoque disponível
      },
      orderBy: { createdAt: 'asc' }, // Mais antigo primeiro (FIFO)
    });
  }

  // Buscar múltiplas StockEntryDetail por productId e data de validade
  async findMultipleStockEntriesByProductAndValidity(
    productId: string,
    validityDate: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.stockEntryDetail.findMany({
      where: {
        productId,
        validityDate,
        quantityOnStock: { gt: 0 }, // Apenas com estoque disponível
      },
      orderBy: { createdAt: 'asc' }, // Mais antigo primeiro (FIFO)
    });
  }

  // Buscar StockEntryDetail por productId e data de validade
  async findStockEntryByProductAndValidity(
    productId: string,
    validityDate: Date,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.stockEntryDetail.findFirst({
      where: {
        productId,
        validityDate,
        quantityOnStock: { gt: 0 }, // Apenas com estoque disponível
      },
      orderBy: { createdAt: 'asc' }, // Mais antigo primeiro se houver múltiplos
    });
  }

  // Atualizar quantidade em estoque
  async updateStockQuantity(
    stockEntryDetailId: string,
    newQuantity: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.stockEntryDetail.update({
      where: { id: stockEntryDetailId },
      data: { quantityOnStock: newQuantity },
    });
  }

  // Buscar StockEntryDetail por ID
  async findStockEntryById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.stockEntryDetail.findUnique({
      where: { id },
    });
  }
}
