import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateOnTheBillDto {
  @IsBoolean()
  canPayOnTheBill: boolean;

  /**
   * Limite próprio deste cliente. Omitido ou null significa "usa o padrão
   * da loja" — é o que permite subir o padrão e beneficiar todo mundo que
   * nunca foi ajustado à mão.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  onTheBillLimit?: number | null;
}
