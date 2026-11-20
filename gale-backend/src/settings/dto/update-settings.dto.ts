import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  storeOpen?: boolean;

  @IsOptional()
  @IsBoolean()
  autoScheduleEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  nightPriceEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  nightPriceStartHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  nightPriceEndHour?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99)
  nightPriceMarkupPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99)
  ifoodMarkupPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freightPrice?: number;

  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  oneManArmyMode?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  state?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  creditCardFeePercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  debitCardFeePercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  pixFeePercent?: number;

  // Teto padrão de notinha, pra quem não tem limite próprio.
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultOnTheBillLimit?: number;

  // Simples Nacional. Só é usado no fechamento mensal (DRE), nunca na
  // venda individual.
  @IsOptional()
  @IsBoolean()
  simplesNacionalEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxDeduction?: number;
}
