import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'operador@lab.local' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'Operador1234!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ enum: ['ADMIN', 'OPERADOR', 'LABORATORIO'], example: 'OPERADOR' })
  @IsEnum(['ADMIN', 'OPERADOR', 'LABORATORIO'], {
    message: 'El rol debe ser ADMIN, OPERADOR o LABORATORIO',
  })
  role: 'ADMIN' | 'OPERADOR' | 'LABORATORIO';
}
