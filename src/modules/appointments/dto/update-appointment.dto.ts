import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string;
}
