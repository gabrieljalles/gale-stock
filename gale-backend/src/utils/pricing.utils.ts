import { Prisma } from '@prisma/client';

export function getUnitPrice(
  product: Prisma.CatalogGetPayload<{}>,
  quantity: number,
  isNight: boolean,
  isIfoodSource: boolean,
): Prisma.Decimal {
  
  if(isIfoodSource && product.consumerIfoodPrice){
    return product.consumerIfoodPrice;
  }

  if (product.isLiquidation && product.liquidationPrice) {
    return product.liquidationPrice;
  }

  const hasPackageDiscount =
    product.wholesaleEnabled &&
    typeof product.packageDiscountAmount === 'number' &&
    product.packageDiscountAmount > 0 &&
    product.discountPackPrice != null &&
    product.discountPackPrice.gt(0) &&
    quantity >= product.packageDiscountAmount;


  // Preço de atacado é um valor fixo negociado por quantidade — não existe
  // uma versão "noturna" dele, então vale independente do horário.
  if (hasPackageDiscount) {
    return product.discountPackPrice!;
  }

  if (isNight && product.consumerNightPrice) {
    return product.consumerNightPrice;
  }

  return product.consumerPrice!;
}