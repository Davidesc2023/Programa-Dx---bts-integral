/**
 * State machine transitions visible to the frontend.
 * Mirrors the TRANSITIONS map in orders.service.ts on the backend.
 * role → current status → allowed next statuses
 */
import { UserRole, OrderStatus } from '@/types/enums';

type TransitionMap = Partial<Record<OrderStatus, OrderStatus[]>>;

const ADMIN_TRANSITIONS: TransitionMap = {
  [OrderStatus.PENDIENTE]: [OrderStatus.CANCELADA],
  [OrderStatus.ACCEPTED]: [OrderStatus.SCHEDULED, OrderStatus.CANCELADA],
  [OrderStatus.SCHEDULED]: [OrderStatus.MUESTRA_RECOLECTADA, OrderStatus.CANCELADA],
  [OrderStatus.MUESTRA_RECOLECTADA]: [OrderStatus.EN_ANALISIS, OrderStatus.RECHAZADA],
  [OrderStatus.EN_ANALISIS]: [OrderStatus.COMPLETADA],
};

const OPERADOR_TRANSITIONS: TransitionMap = {
  [OrderStatus.PENDIENTE]: [OrderStatus.CANCELADA],
  [OrderStatus.ACCEPTED]: [OrderStatus.SCHEDULED, OrderStatus.CANCELADA],
  [OrderStatus.SCHEDULED]: [OrderStatus.CANCELADA],
};

const LAB_TRANSITIONS: TransitionMap = {
  [OrderStatus.ACCEPTED]: [OrderStatus.SCHEDULED],
  [OrderStatus.SCHEDULED]: [OrderStatus.MUESTRA_RECOLECTADA],
  [OrderStatus.MUESTRA_RECOLECTADA]: [OrderStatus.EN_ANALISIS, OrderStatus.RECHAZADA],
  [OrderStatus.EN_ANALISIS]: [OrderStatus.COMPLETADA],
};

const BY_ROLE: Record<UserRole, TransitionMap> = {
  [UserRole.ADMIN]: ADMIN_TRANSITIONS,
  [UserRole.OPERADOR]: OPERADOR_TRANSITIONS,
  [UserRole.LABORATORIO]: LAB_TRANSITIONS,
  [UserRole.MEDICO]: {},
  [UserRole.PACIENTE]: {},
};

export function getAllowedTransitions(
  role: UserRole,
  currentStatus: OrderStatus,
): OrderStatus[] {
  return BY_ROLE[role]?.[currentStatus] ?? [];
}
