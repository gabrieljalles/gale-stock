import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCatalogDto } from './dto/update-catalog.dto';

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.catalog.findUnique({
      where: { id: id },
    });
  }

  async findManyById(productIds: string[], tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.catalog.findMany({
      where: { id: { in: productIds } },
      include: { product: { select: { name: true } } },
    });
  }

  async create(
    id: string,
    consumerPrice?: Prisma.Decimal,
    consumerNightPrice?: Prisma.Decimal,
    consumerIfoodPrice?: Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.catalog.create({
      data: {
        id,
        consumerPrice,
        consumerNightPrice,
        consumerIfoodPrice,
      },
    });
  }

  async update(
    id: string,
    data: UpdateCatalogDto,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.catalog.update({
      where: { id },
      data,
    });
  }

  async updateManyAvailability(
    productIds: string[],
    available: boolean,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.catalog.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: {
        available,
      },
    });
  }

  async findAllWithProductsAndStock() {
    return this.prisma.catalog.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barCode: true,
            description: true,
            category: true,
            pack: true,
            sizeType: true,
            size: true,
            imgUrl: true,
            stockEntries: {
              select: {
                quantityOnStock: true,
              },
            },
          },
        },
      },
    });
  }
}
