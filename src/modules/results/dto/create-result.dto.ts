import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateResultDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'UUID de la orden' })
  @IsUUID('4', { message: 'El ID de la orden no es válido' })
  orderId: string;

  @ApiProperty({ example: 'Hemograma completo' })
  @IsString()
  @MinLength(1, { message: 'El tipo de examen es requerido' })
  examType: string;

  @ApiProperty({ example: '14.5' })
  @IsString()
  @MinLength(1, { message: 'El valor del resultado es requerido' })
  value: string;

  @ApiPropertyOptional({ example: 'g/dL' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '12.0 - 16.0' })
  @IsOptional()
  @IsString()
  referenceRange?: string;

  @ApiPropertyOptional({ example: 'Resultado dentro de parámetros normales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
