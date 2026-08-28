import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CloseTabDto {
  @IsString()
  @MinLength(1)
  clientId: string;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  // Multa/juros por atraso, em R$ — só faz sentido se a notinha já tiver
  // 30+ dias (validado também no frontend, mas o valor em si é livre).
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  interestAmount?: number;
}
