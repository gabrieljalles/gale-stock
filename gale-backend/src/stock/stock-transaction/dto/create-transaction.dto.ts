import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';

export class CreateStockTransactionDto {
  @IsString()
  supplierId: string;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsNumber()
  numberPayments: number;

  @IsOptional()
  @IsDateString()
  firstPaymentDate?: string;

  @IsNumber()
  totalProductCost: number;

  @IsNumber()
  freightCost: number;

  @IsNumber()
  feeCost: number;

  @IsNumber()
  totalCost: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockEntryDetailDto)
  stockEntryDetail: CreateStockEntryDetailDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransactionInstallmentDto)
  installments: CreateStockTransactionInstallmentDto[];
}

export class CreateStockTransactionInstallmentDto {
  @IsNumber()
  installmentNumber: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  paidDate?: string;

  @IsNumber()
  fragmentCost: number;
}

export class CreateStockEntryDetailDto {
  @IsString()
  productId: string;

  @IsNumber()
  initialQuantity: number;

  @IsDateString()
  validityDate: string;

  @IsNumber()
  baseUnitCost: number;

  @IsNumber()
  totalProductCost: number;
}
