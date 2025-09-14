import { Injectable } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository';
import { Prisma } from '@prisma/client';
import { UpdateCatalogDto } from './dto/update-catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async findProductById(productId: string, tx?: Prisma.TransactionClient) {
    return await this.repository.findById(productId, tx);
  }

  async findManyProductsByIds(
    productIds: string[],
    tx?: Prisma.TransactionClient,
  ) {
    return await this.repository.findManyById(productIds, tx);
  }

  async createCatalogForProduct(
    productId: string,
    consumerPrice?: Prisma.Decimal,
    tx?: Prisma.TransactionClient,
  ) {
    // Se consumerPrice foi fornecido, calcular os preços derivados
    let consumerNightPrice: Prisma.Decimal | undefined;
    let consumerIfoodPrice: Prisma.Decimal | undefined;

    if (consumerPrice) {
      // consumerNightPrice = consumerPrice / 0.95
      consumerNightPrice = new Prisma.Decimal(consumerPrice).div(0.9);

      // consumerIfoodPrice = consumerPrice / 0.8
      consumerIfoodPrice = new Prisma.Decimal(consumerPrice).div(0.8);
    }

    return await this.repository.create(
      productId,
      consumerPrice,
      consumerNightPrice,
      consumerIfoodPrice,
      tx,
    );
  }

  //Precisa criar um multiplicador para nightPrice
  async updateCatalog(id: string, data: UpdateCatalogDto) {
    return await this.repository.update(id, data);
  }

  async updateProductsAvailability(
    productIds: string[],
    available: boolean,
    tx?: Prisma.TransactionClient,
  ) {
    return await this.repository.updateManyAvailability(productIds, available, tx);
  }
}
