import { Category, SizeType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  barCode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @IsOptional()
  @IsEnum(SizeType)
  sizeType?: SizeType;

  @IsOptional()
  @IsInt()
  pack?: number;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  imgUrl?: string;
}
