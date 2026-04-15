import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdatePatientDto {
  @IsOptional()
  @IsEnum(['DNI', 'PASAPORTE', 'CE', 'NIT', 'CC', 'TI', 'RC'], {
    message: 'El tipo de documento debe ser DNI, PASAPORTE, CE, NIT, CC, TI o RC',
  })
  documentType?: 'DNI' | 'PASAPORTE' | 'CE' | 'NIT' | 'CC' | 'TI' | 'RC';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20, { message: 'El número de documento no puede superar 20 caracteres' })
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  lastName?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (ISO 8601)' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7,15}$/, { message: 'El teléfono debe contener entre 7 y 15 dígitos' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico del paciente no es válido' })
  email?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  insurance?: string;
}

