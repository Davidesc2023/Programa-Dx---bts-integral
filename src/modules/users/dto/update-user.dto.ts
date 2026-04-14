import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(['ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO'], {
    message: 'El rol debe ser ADMIN, OPERADOR, LABORATORIO o MEDICO',
  })
  role?: 'ADMIN' | 'OPERADOR' | 'LABORATORIO' | 'MEDICO';

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(['DNI', 'PASAPORTE', 'CE', 'NIT', 'CC', 'TI', 'RC'], {
    message: 'Tipo de documento inválido',
  })
  documentType?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  medicalLicense?: string;
}
