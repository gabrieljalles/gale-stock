import { Category, ReasonLoss, SizeType } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateLostEntryDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsDateString()
  validityDate?: string;

  @IsInt()
  quantity: number;

  @IsEnum(ReasonLoss)
  reasonLoss: ReasonLoss;

  @IsOptional()
  @IsString()
  note?: string;
}
