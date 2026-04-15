import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export type DocumentType = 'DNI' | 'PASAPORTE' | 'CE' | 'NIT' | 'CC' | 'TI' | 'RC';

export class CreatePatientDto {
  @ApiProperty({ enum: ['DNI', 'PASAPORTE', 'CE', 'NIT', 'CC', 'TI', 'RC'], example: 'CC' })
  @IsEnum(['DNI', 'PASAPORTE', 'CE', 'NIT', 'CC', 'TI', 'RC'], {
    message: 'Tipo de documento inválido',
  })
  documentType: DocumentType;

  @ApiProperty({ example: '12345678', maxLength: 20 })
  @IsString()
  @MinLength(1, { message: 'El número de documento es requerido' })
  @MaxLength(20, { message: 'El número de documento no puede superar 20 caracteres' })
  documentNumber: string;

  @ApiProperty({ example: 'Juan', minLength: 2 })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  firstName: string;

  @ApiProperty({ example: 'Pérez', minLength: 2 })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  lastName: string;

  @ApiProperty({ example: '1990-01-15', description: 'Fecha de nacimiento (ISO 8601)' })
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (ISO 8601)' })
  birthDate: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{7,15}$/, { message: 'El teléfono debe contener entre 7 y 15 dígitos' })
  phone?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico del paciente no es válido' })
  email?: string;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Calle 123 # 45-67' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Sanitas EPS' })
  @IsOptional()
  @IsString()
  insurance?: string;
}
