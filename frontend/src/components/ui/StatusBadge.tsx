import { Badge } from './Badge';
import { ORDER_STATUS_LABELS, OrderStatus } from '@/types/enums';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal' | 'orange';

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  [OrderStatus.PENDIENTE]: 'default',
  [OrderStatus.CONSENT_PENDING]: 'warning',
  [OrderStatus.ACCEPTED]: 'success',
  [OrderStatus.SCHEDULED]: 'teal',
  [OrderStatus.MUESTRA_RECOLECTADA]: 'info',
  [OrderStatus.EN_ANALISIS]: 'purple',
  [OrderStatus.COMPLETADA]: 'success',
  [OrderStatus.CANCELADA]: 'danger',
  [OrderStatus.RECHAZADA]: 'orange',
};

interface StatusBadgeProps {
  status: OrderStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
