import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'UUID del paciente' })
  @IsUUID('4', { message: 'El ID del paciente no es válido' })
  patientId: string;

  @ApiPropertyOptional({ example: '22222222-2222-2222-2222-222222222222', description: 'UUID del médico (User) responsable' })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del doctor no es válido' })
  doctorId?: string;

  @ApiPropertyOptional({ example: 'Dr. Martínez' })
  @IsOptional()
  @IsString()
  physician?: string;

  @ApiPropertyOptional({ enum: ['URGENTE', 'NORMAL', 'RUTINA'], example: 'NORMAL' })
  @IsOptional()
  @IsEnum(['URGENTE', 'NORMAL', 'RUTINA'], {
    message: 'La prioridad debe ser URGENTE, NORMAL o RUTINA',
  })
  priority?: 'URGENTE' | 'NORMAL' | 'RUTINA';

  @ApiPropertyOptional({ example: 'Paciente con síntomas de anemia' })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({ example: '2026-04-20', description: 'Fecha estimada de completado (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha estimada debe ser una fecha válida (ISO 8601)' })
  estimatedCompletionDate?: string;
}
