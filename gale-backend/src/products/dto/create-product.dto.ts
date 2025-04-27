import { Category, SizeType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  IsInt,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  description: string;

  @IsEnum(Category)
  category: Category;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsEnum(SizeType)
  sizeType: SizeType;

  @IsInt()
  pack: number;

  @IsOptional()
  consumerPrice: Decimal;

  @IsString()
  size: string;

  @IsString()
  imgUrl: string;
}
