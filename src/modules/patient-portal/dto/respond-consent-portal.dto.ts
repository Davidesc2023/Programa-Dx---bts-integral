import { IsOptional, IsString } from 'class-validator';

export class RespondConsentPortalDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
