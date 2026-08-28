import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateStockEntryDetailDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantityOnStock?: number;

  @IsOptional()
  @IsDateString()
  validityDate?: string;
}
