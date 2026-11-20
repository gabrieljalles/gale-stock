import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdatePointsSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  // Pontos por R$1. O teto de 10 é só uma barreira contra dedo errado —
  // 1 ponto por real já é 1% de cashback, 10 seria 10%.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  moneyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  pixRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  creditRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  debitRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  onTheBillGraceDays?: number;

  @IsOptional()
  @IsBoolean()
  mlmEnabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  selfMultiplier?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  level2Multiplier?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  level3Multiplier?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  level4Multiplier?: number;

  @IsOptional()
  @IsBoolean()
  tiersEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  activeAffiliateWindowDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pointsPerReal?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minRedeemPoints?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxRedeemPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  expirationDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  inactivityDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxCashbackPercent?: number;

  /**
   * Confirmação explícita de que o Admin viu o aviso e quer salvar mesmo
   * assim uma configuração que projeta distribuição acima do teto.
   *
   * O padrão é recusar: a conta de "quanto isso custa" é justamente a que
   * ninguém faz de cabeça na hora de mexer num multiplicador.
   */
  @IsOptional()
  @IsBoolean()
  acknowledgeCashbackRisk?: boolean;
}

export class PointsTierDto {
  @IsInt()
  @Min(0)
  level: number;

  @IsString()
  @MinLength(1)
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  multiplier: number;

  @IsInt()
  @Min(0)
  minActiveAffiliates: number;
}

export class UpdatePointsTiersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PointsTierDto)
  tiers: PointsTierDto[];

  @IsOptional()
  @IsBoolean()
  acknowledgeCashbackRisk?: boolean;
}

/** Simulação do ganho antes de fechar a compra (usada no checkout). */
export class QuotePointsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  productTotal: number;

  @IsOptional()
  @IsString()
  transactionType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pointsToRedeem?: number;
}
