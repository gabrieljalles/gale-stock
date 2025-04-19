import { DeliveryType, OrderSource, OrderStatus, TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsOptional, MinLength, MaxLength, IsNumber, IsDateString, IsArray, ValidateNested, IsEnum, IsInt } from 'class-validator';

export class CreateOrderRequestDto {
    @IsEnum(DeliveryType)
    deliveryType: DeliveryType;
  
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
    addressId?: string;
  
    @IsOptional()
    @IsEnum(OrderStatus)
    orderStatus?: OrderStatus;
  }

  export class CreateOrderDetailsDto {
    @IsString()
    orderRequestId: string;
  
    @IsString()
    productId: string;
  
    @IsInt()
    quantity: number;
  
    @IsNumber()
    unityPrice: number;
  
    @IsNumber()
    totalPrice: number;
}

export class CreateOrderTransactionDto {
    @IsString()
    orderRequestId: string;
  
    @IsEnum(TransactionType)
    transactionType: TransactionType;
  
    @IsNumber()
    totalPrice: number;
  
    @IsString()
    statusCheckout: string;
  
    @IsOptional()
    @IsDateString()
    paidDate?: string;
}

export class CreateFullOrderDto{
  @ValidateNested()
  @Type(() => CreateOrderRequestDto)
  orderRequest: CreateOrderRequestDto

  @IsArray()
  @ValidateNested({each: true})
  @Type(() => CreateOrderDetailsDto)
  orderDetails: CreateOrderDetailsDto[];

  @ValidateNested()
  @Type(() => CreateOrderTransactionDto)
  orderTransaction: CreateOrderTransactionDto;
}

   