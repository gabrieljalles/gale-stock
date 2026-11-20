import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class DayScheduleDto {
  /** 0 = domingo ... 6 = sábado. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @IsBoolean()
  isOpen: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  openHour: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(59)
  openMinute: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(23)
  closeHour: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(59)
  closeMinute: number;
}

export class UpdateScheduleDto {
  // A semana inteira sempre: salvar dia solto abriria espaço pra uma grade
  // inconsistente entre o que a tela mostra e o que o banco tem.
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => DayScheduleDto)
  days: DayScheduleDto[];
}
