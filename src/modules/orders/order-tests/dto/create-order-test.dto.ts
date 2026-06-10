import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOrderTestDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-...', description: 'ID del examen del catálogo (opcional)' })
  @IsOptional()
  @IsUUID()
  labTestId?: string;

  @ApiPropertyOptional({ example: 'HEM-001', description: 'Código del examen (inferido del catálogo si labTestId presente)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  examCode?: string;

  @ApiPropertyOptional({ example: 'Hemograma completo', description: 'Nombre del examen (inferido del catálogo si labTestId presente)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  examName?: string;

  @ApiPropertyOptional({ example: 'Ayuno de 8 horas requerido' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
