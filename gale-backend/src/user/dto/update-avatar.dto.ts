import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  // null/ausente remove a foto e volta pras iniciais.
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  avatarUrl?: string | null;
}
