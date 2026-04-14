import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindUsersQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit: number = 20;

  @ApiPropertyOptional({ example: 'MEDICO', enum: ['ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO'], {
    message: 'Rol inválido',
  })
  role?: string;

  @ApiPropertyOptional({ example: 'Carlos', description: 'Buscar por nombre, apellido o correo' })
  @IsOptional()
  @IsString()
  search?: string;
}
