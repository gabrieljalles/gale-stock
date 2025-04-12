import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Supplier, Prisma } from '@prisma/client';

@Injectable()
export class SupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SupplierCreateInput): Promise<Supplier> {
    return this.prisma.supplier.create({ data });
  }

  async findAll(): Promise<Supplier[]> {
    return this.prisma.supplier.findMany();
  }

  async findById(id: string): Promise<Supplier | null> {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<Supplier> {
    return this.prisma.supplier.delete({ where: { id } });
  }
}
