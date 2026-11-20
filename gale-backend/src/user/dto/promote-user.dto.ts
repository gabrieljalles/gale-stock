import { AccountType } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class PromoteUserDto {
  @IsEnum(AccountType)
  accountType: AccountType;

  @IsString()
  @MinLength(1)
  password: string;
}
