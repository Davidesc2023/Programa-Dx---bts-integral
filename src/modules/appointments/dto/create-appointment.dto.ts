import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'UUID del paciente' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ example: '22222222-2222-2222-2222-222222222222', description: 'UUID de la orden (opcional)' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty({ example: '2026-04-20T10:00:00.000Z', description: 'Fecha y hora de la cita (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 'Paciente en ayunas' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string;
}
