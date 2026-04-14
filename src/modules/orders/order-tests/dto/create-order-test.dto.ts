import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrderTestDto {
  @ApiProperty({ example: 'HEM-001', description: 'Código del examen' })
  @IsString()
  @MaxLength(50)
  examCode: string;

  @ApiProperty({ example: 'Hemograma completo', description: 'Nombre del examen' })
  @IsString()
  @MaxLength(200)
  examName: string;

  @ApiPropertyOptional({ example: 'Ayuno de 8 horas requerido', description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
