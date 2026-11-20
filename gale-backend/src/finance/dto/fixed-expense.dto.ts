import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FixedExpenseType } from '@prisma/client';

export class UpsertFixedExpenseDto {
  @IsEnum(FixedExpenseType)
  type: FixedExpenseType;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  referenceYear: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  referenceMonth: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
