import { Category, ReasonLoss, SizeType } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  IsInt,
} from 'class-validator';

export class CreateLostEntryDto {

    @IsEnum(ReasonLoss)
    reasonLoss: ReasonLoss;

    @IsInt()
    quantity: number;

    @IsOptional()
    @IsString()
    note: string;

    @IsString()
    productId: string;
}
