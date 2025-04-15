import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, Min } from "class-validator";

export class UpdateCatalogDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    finalConsumerPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    finalIfoodConsumerPrice?: number;

    @IsOptional()
    @IsBoolean()
    isLiquidation?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    discountPrice?: number;

    @IsOptional()
    @IsInt()
    quantityDiscount?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    discountQtdPrice?: number;

    @IsOptional()
    @IsInt()
    stock?: number;

    @IsOptional()
    @IsBoolean()
    available?: boolean;
}
