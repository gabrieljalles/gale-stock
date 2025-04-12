import { IsDateString, IsOptional } from "class-validator";

export class UpdateInstallmentDto{
    @IsOptional()
    @IsDateString()
    paidDate?: string;
}