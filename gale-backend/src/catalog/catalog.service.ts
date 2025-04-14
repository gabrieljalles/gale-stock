import { Injectable } from "@nestjs/common";
import { CatalogRepository } from "./catalog.repository";
import { Prisma } from "@prisma/client";

@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async createCatalogForProduct(productId: string, tx?: Prisma.TransactionClient){
    return await this.repository.create(productId, tx);
  }
  
}