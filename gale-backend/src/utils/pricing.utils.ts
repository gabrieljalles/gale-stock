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
    typeof product.packageDiscountAmount === 'number' &&
    product.packageDiscountAmount > 0 &&
    product.discountPackPrice != null &&
    product.discountPackPrice.gt(0) &&
    quantity >= product.packageDiscountAmount;


  if (hasPackageDiscount && isNight) {
    return product.liquidationPrice!;
  }

  if(hasPackageDiscount && !isNight){
    return product.discountPackPrice!;
  }

  if (isNight && product.consumerNightPrice) {
    return product.consumerNightPrice;
  }

  return product.consumerPrice!;
}