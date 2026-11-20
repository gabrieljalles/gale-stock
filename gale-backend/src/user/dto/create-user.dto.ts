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

  // Código do link de indicação (/register?ref=CODIGO). Opcional e sem
  // validação de existência aqui: código errado ou expirado não pode
  // impedir alguém de criar conta — só não gera vínculo.
  @IsOptional()
  @IsString()
  referralCode?: string;
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

export class ResendEmailDto {
  @IsEmail()
  email: string;
}
