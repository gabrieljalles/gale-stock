import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Supplier, Prisma } from '@prisma/client';
import { generatePrefixedId } from 'src/utils/generate-prefix-id';

@Injectable()
export class SupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Omit<Prisma.SupplierCreateInput, 'id'>,
  ): Promise<Supplier> {
    return this.prisma.supplier.create({
      data: {
        id: generatePrefixedId('S', 6),
        ...data,
      },
    });
  }

  async findAll(): Promise<Supplier[]> {
    return this.prisma.supplier.findMany();
  }

  async findById(id: string): Promise<Supplier | null> {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Partial<Omit<Prisma.SupplierUpdateInput, 'id'>>,
  ): Promise<Supplier> {
    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Supplier> {
    return this.prisma.supplier.delete({ where: { id } });
  }
}
