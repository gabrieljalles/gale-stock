import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateOrderAddressDto, CreateOrderDetailsDto } from './create-order.dto';

export class CreateCustomerOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailsDto)
  orderDetails: CreateOrderDetailsDto[];

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  // Pontos que o cliente escolheu usar no checkout.
  @IsOptional()
  @IsNumber()
  @Min(0)
  pointsToRedeem?: number;

  // Endereço já salvo na conta...
  @IsOptional()
  @IsString()
  userAddressId?: string;

  // ...ou um escrito na hora, sem salvar na conta.
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderAddressDto)
  orderAddress?: CreateOrderAddressDto;
}
