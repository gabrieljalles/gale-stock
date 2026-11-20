import { IsBoolean, IsString } from 'class-validator';

export class ToggleChecklistDto {
  @IsString()
  orderDetailId: string;

  @IsBoolean()
  checked: boolean;
}

export class AssignDriverDto {
  @IsString()
  deliveryManId: string;
}
