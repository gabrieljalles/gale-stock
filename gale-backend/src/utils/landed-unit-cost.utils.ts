import { Prisma } from '@prisma/client';
import { CreateStockEntryDetailDto } from 'src/stock/stock-transaction/dto/create-transaction.dto';

export function getLandedUnitCost(
  p: CreateStockEntryDetailDto,
  dto: {
    totalProductCost: number | Prisma.Decimal;
    freightCost?: number | Prisma.Decimal;
    feeCost?: number | Prisma.Decimal;
  },
): Prisma.Decimal {
  const freight = dto.freightCost ?? new Prisma.Decimal(0);
  const fee = dto.feeCost ?? new Prisma.Decimal(0);
  const totalTax = new Prisma.Decimal(freight).add(new Prisma.Decimal(fee));

  const ratio = new Prisma.Decimal(p.totalProductCost).div(
    new Prisma.Decimal(dto.totalProductCost),
  );

  const extraForProduct = ratio.mul(totalTax);

  const taxUnitCost = extraForProduct.div(p.initialQuantity);

  const landedUnitCost = taxUnitCost.add(p.baseUnitCost);

  return landedUnitCost;
}
