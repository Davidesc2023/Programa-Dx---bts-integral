import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class FindOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID del paciente no es válido' })
  patientId?: string;

  @IsOptional()
  @IsEnum(
    ['PENDIENTE', 'MUESTRA_RECOLECTADA', 'EN_ANALISIS', 'COMPLETADA', 'CANCELADA', 'RECHAZADA'],
    { message: 'El estado debe ser un valor válido del flujo de órdenes' },
  )
  status?: string;
}
