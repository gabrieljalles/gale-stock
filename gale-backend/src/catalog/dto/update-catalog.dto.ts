import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCatalogDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  consumerPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  consumerNightPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  consumerIfoodPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  liquidationPrice?: number;

  @IsOptional()
  @IsBoolean()
  isLiquidation?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountPackPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  packageDiscountAmount?: number;

  @IsOptional()
  @IsBoolean()
  wholesaleEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
