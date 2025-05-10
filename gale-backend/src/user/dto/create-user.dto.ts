import { AccountType, TypeAddress, GenderType } from '@prisma/client';
import {
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  cellPhone: string;

  @IsEnum(GenderType)
  gender: GenderType;

  @IsDateString()
  dateOfBirth: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  cpfCNPJ: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

export class CreateUserAddressDto {
  @IsEnum(TypeAddress)
  typeAddress: TypeAddress;

  @IsString()
  address: string;

  @IsString()
  number: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  district: string;

  @IsOptional()
  @IsString()
  zipCode?: string;
}
