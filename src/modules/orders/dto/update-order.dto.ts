import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateOrderDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID('4', { message: 'El ID del doctor no es válido' })
  doctorId?: string;

  @IsOptional()
  @IsString()
  physician?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsEnum(['URGENTE', 'NORMAL', 'RUTINA'], {
    message: 'La prioridad debe ser URGENTE, NORMAL o RUTINA',
  })
  priority?: 'URGENTE' | 'NORMAL' | 'RUTINA';

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha estimada debe ser una fecha válida (ISO 8601)' })
  estimatedCompletionDate?: string;
}
