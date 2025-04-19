import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { UpdateCatalogDto } from "./dto/update-catalog.dto";

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  async findById(id: string, tx ?: Prisma.TransactionClient){
    const client = tx?? this.prisma;
    return client.catalog.findUnique({
      where: {id: id}
    })
  }

  async create(id: string, tx?:Prisma.TransactionClient){
      const client = tx?? this.prisma;
      return client.catalog.create({ data:{
          id,
      } });
    }

  async update(id: string, data: UpdateCatalogDto, tx?: Prisma.TransactionClient){
    const client = tx ?? this.prisma;
    return client.catalog.update({
      where: {id},
      data,
    })
  }
}