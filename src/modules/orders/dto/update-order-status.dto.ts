import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: ['SCHEDULED', 'MUESTRA_RECOLECTADA', 'EN_ANALISIS', 'COMPLETADA', 'CANCELADA', 'RECHAZADA'],
    description: 'Nuevo estado de la orden (los estados CONSENT_PENDING, ACCEPTED y RECHAZADA son gestionados por el módulo de Consentimiento)',
  })
  @IsEnum(
    ['SCHEDULED', 'MUESTRA_RECOLECTADA', 'EN_ANALISIS', 'COMPLETADA', 'CANCELADA', 'RECHAZADA'],
    { message: 'El estado debe ser un valor válido del flujo de órdenes' },
  )
  status: string;
}
