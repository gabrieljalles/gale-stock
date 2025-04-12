import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  legalRepresentative: string;

  @IsString()
  enterprise: string;

  @IsString()
  city: string;

  @IsString()
  @MinLength(14)
  @MaxLength(16)
  cellphone: string;

  @IsOptional()
  @IsString()
  appName?: string;
}