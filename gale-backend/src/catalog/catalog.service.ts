import { Injectable } from '@nestjs/common';
import { CatalogRepository } from './catalog.repository';
import { Prisma } from '@prisma/client';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { SettingsService } from 'src/settings/settings.service';
import { getUnitPrice } from 'src/utils/pricing.utils';

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

  // Catálogo da vitrine (rota pública). Devolve SÓ o que o cliente pode
  // ver: nunca custo, margem, landedUnitCost ou preço de iFood. O preço
  // sai já resolvido pela mesma regra da venda (liquidação > noturno >
  // normal), pra vitrine e caixa nunca divergirem.
  async findStorefrontCatalog() {
    const items = await this.repository.findAllWithProductsAndStock();
    const isNight = await this.settingsService.isNightPrice();

    return items
      .map((item) => {
        const totalStock = item.product.stockEntries.reduce(
          (total, entry) => total + entry.quantityOnStock,
          0,
        );

        const price = getUnitPrice(item, 1, isNight, false);

        return {
          available: item.available,
          id: item.id,
          name: item.product.name,
          description: item.product.description,
          category: item.product.category,
          size: item.product.size,
          sizeType: item.product.sizeType,
          imgUrl: item.product.imgUrl,
          price: price ? Number(price) : null,
          isLiquidation: item.isLiquidation,
          // Preço de atacado: o cliente precisa saber pra aproveitar.
          packageDiscountAmount: item.wholesaleEnabled
            ? item.packageDiscountAmount
            : null,
          packagePrice:
            item.wholesaleEnabled && item.discountPackPrice
              ? Number(item.discountPackPrice)
              : null,
          // Quantidade exata não interessa (e é informação interna); o que
          // importa pro cliente é poder comprar e até quanto.
          inStock: totalStock > 0,
          maxQuantity: totalStock,
        };
      })
      // Fora de circulação, sem preço definido ou sem estoque não aparece
      // na vitrine.
      .filter((item) => item.available && item.price != null && item.inStock)
      // `available` era só pro filtro — não vai pra resposta.
      .map(({ available, ...item }) => item);
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
