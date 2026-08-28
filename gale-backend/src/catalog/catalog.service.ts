import { Injectable } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository';
import { Prisma } from '@prisma/client';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { SettingsService } from 'src/settings/settings.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly repository: CatalogRepository,
    private readonly settingsService: SettingsService,
  ) {}

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
    // a partir das % configuradas em Configurações.
    let consumerNightPrice: Prisma.Decimal | undefined;
    let consumerIfoodPrice: Prisma.Decimal | undefined;

    if (consumerPrice) {
      const { nightPriceDivisor, ifoodPriceDivisor } =
        await this.settingsService.getPriceDivisors();

      consumerNightPrice = new Prisma.Decimal(consumerPrice).div(
        nightPriceDivisor,
      );
      consumerIfoodPrice = new Prisma.Decimal(consumerPrice).div(
        ifoodPriceDivisor,
      );
    }

    return await this.repository.create(
      productId,
      consumerPrice,
      consumerNightPrice,
      consumerIfoodPrice,
      tx,
    );
  }

  async updateCatalog(id: string, dto: UpdateCatalogDto) {
    const data: UpdateCatalogDto = { ...dto };

    // Se o preço normal mudou, recalcular noturno/iFood automaticamente
    // (a partir das % configuradas em Configurações), a menos que um valor
    // específico para eles também tenha sido informado nesta mesma edição.
    if (dto.consumerPrice !== undefined) {
      if (dto.consumerNightPrice === undefined || dto.consumerIfoodPrice === undefined) {
        const { nightPriceDivisor, ifoodPriceDivisor } =
          await this.settingsService.getPriceDivisors();

        if (dto.consumerNightPrice === undefined) {
          data.consumerNightPrice = dto.consumerPrice / nightPriceDivisor;
        }
        if (dto.consumerIfoodPrice === undefined) {
          data.consumerIfoodPrice = dto.consumerPrice / ifoodPriceDivisor;
        }
      }
    }

    return await this.repository.update(id, data);
  }

  async findAllWithProductsAndStock() {
    return await this.repository.findAllWithProductsAndStock();
  }

  async updateProductsAvailability(
    productIds: string[],
    available: boolean,
    tx?: Prisma.TransactionClient,
  ) {
    return await this.repository.updateManyAvailability(
      productIds,
      available,
      tx,
    );
  }
}
