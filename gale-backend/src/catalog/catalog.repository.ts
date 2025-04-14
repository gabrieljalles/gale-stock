import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

    async create(id: string, tx?:Prisma.TransactionClient){
        const client = tx?? this.prisma;
        return client.catalog.create({ data:{
            id,
        } });
      }
}