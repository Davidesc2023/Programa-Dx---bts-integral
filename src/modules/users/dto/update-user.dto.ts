import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(['ADMIN', 'OPERADOR', 'LABORATORIO'], {
    message: 'El rol debe ser ADMIN, OPERADOR o LABORATORIO',
  })
  role?: 'ADMIN' | 'OPERADOR' | 'LABORATORIO';
}
