import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@lab.local', description: 'Correo electrónico del usuario' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({ example: 'Admin1234!', description: 'Contraseña del usuario' })
  @IsString({ message: 'La contraseña es requerida' })
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}
