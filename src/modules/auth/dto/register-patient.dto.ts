import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterPatientDto {
  @ApiProperty({ example: 'paciente@ejemplo.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'MiClave2026!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: 'CC' })
  @IsEnum(['DNI', 'PASAPORTE', 'CE', 'NIT', 'CC', 'TI', 'RC'], {
    message: 'Tipo de documento inválido',
  })
  documentType: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  documentNumber: string;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  lastName?: string;
}
