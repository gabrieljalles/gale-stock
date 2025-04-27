import { DeliveryType, OrderSource, OrderStatus, TransactionType, TypeAddress } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsOptional, MinLength, MaxLength, IsNumber, IsDateString, IsArray, ValidateNested, IsEnum, IsInt } from 'class-validator';

export class CreateOrderDto {
    @IsEnum(DeliveryType)
    deliveryType: DeliveryType;

    @IsOptional()
    @IsEnum(OrderSource)
    orderSource: OrderSource;

    @IsOptional()
    @IsString()
    clientId?: string;
  
    @IsOptional()
    @IsString()
    deliveryManId?: string;
  
    @IsOptional()
    @IsString()
    userAddressId?: string;  //Não tem na tabela
  
    @IsOptional()
    @IsEnum(OrderStatus)
    orderStatus?: OrderStatus;
  }

  export class CreateOrderDetailsDto {
  
    @IsString()
    productId: string;
  
    @IsInt()
    quantity: number;

}

export class CreateOrderTransactionDto {

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType: TransactionType;

}

export class CreateOrderAddressDto {
  
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
}

export class CreateFullOrderDto{
  @ValidateNested()
  @Type(() => CreateOrderDto)
  order: CreateOrderDto

  @IsArray()
  @ValidateNested({each: true})
  @Type(() => CreateOrderDetailsDto)
  orderDetails: CreateOrderDetailsDto[];

  @ValidateNested()
  @Type(() => CreateOrderTransactionDto)
  orderTransaction: CreateOrderTransactionDto;

  @ValidateNested()
  @Type(() => CreateOrderAddressDto)
  orderAddress: CreateOrderAddressDto;
}

   