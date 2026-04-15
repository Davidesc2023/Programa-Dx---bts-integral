import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'medico@bts-integral.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'Medico1234!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ enum: ['ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO', 'PACIENTE'], example: 'MEDICO' })
  @IsEnum(['ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO', 'PACIENTE'], {
    message: 'El rol debe ser ADMIN, OPERADOR, LABORATORIO, MEDICO o PACIENTE',
  })
  role: 'ADMIN' | 'OPERADOR' | 'LABORATORIO' | 'MEDICO' | 'PACIENTE';

  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ramírez Gómez' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'CC' })
  @IsOptional()
  @IsEnum(['DNI', 'PASAPORTE', 'CE', 'NIT', 'CC', 'TI', 'RC'], {
    message: 'Tipo de documento inválido',
  })
  documentType?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({ example: '+57 310 5571733' })
  @IsOptional()
  @IsString()
  phone?: string;

  /** Solo para rol MEDICO */
  @ApiPropertyOptional({ example: 'Neurología' })
  @IsOptional()
  @IsString()
  specialty?: string;

  /** Número de registro médico — Solo MEDICO */
  @ApiPropertyOptional({ example: 'RM-123456' })
  @IsOptional()
  @IsString()
  medicalLicense?: string;
}
