import { TransactionType, TypeAddress } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateSaleItemDto {
  @IsString()
  orderDetailId: string;

  // 0 = remove o produto da venda (devolve o estoque)
  @IsInt()
  @Min(0)
  quantity: number;
}

export class UpdateSaleDto {
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  // string = reatribui o comprador; null = torna a venda anônima
  @IsOptional()
  @IsString()
  clientId?: string | null;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsOptional()
  @IsEnum(TypeAddress)
  typeAddress?: TypeAddress;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSaleItemDto)
  items?: UpdateSaleItemDto[];
}
