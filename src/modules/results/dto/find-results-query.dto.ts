import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class FindResultsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la orden no es válido' })
  orderId?: string;
}
