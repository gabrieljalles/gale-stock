import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsOptional, MinLength, MaxLength, IsNumber, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator';

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

  @IsString()
  statusCheckout: string;

  @IsArray()
  @ValidateNested({ each: true})
  @Type(() => CreateStockEntryDetailDto)
  stockEntryDetails: CreateStockEntryDetailDto[];

  @IsArray()
  @ValidateNested({each: true})
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
    quantity: number;

    @IsDateString()
    validityDate: string;

    @IsNumber()
    productCost: number;

    @IsNumber()
    totalProductCost: number;
}

