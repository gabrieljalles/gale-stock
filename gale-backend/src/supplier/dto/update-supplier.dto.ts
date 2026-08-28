import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateSupplierDto {
  @IsString()
  @IsOptional()
  legalRepresentative?: string;

  @IsString()
  @IsOptional()
  enterprise?: string;

  @IsString()
  @IsOptional()
  completeAddress?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @MinLength(14)
  @MaxLength(16)
  @IsOptional()
  cellphone?: string;

  @IsOptional()
  @IsString()
  appName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  imgUrl?: string;
}
