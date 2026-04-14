/**
 * Enums del dominio APP-DX — sincronizados con Prisma schema del backend
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
  LABORATORIO = 'LABORATORIO',
  MEDICO = 'MEDICO',
}

export enum OrderStatus {
  PENDIENTE = 'PENDIENTE',
  CONSENT_PENDING = 'CONSENT_PENDING',
  ACCEPTED = 'ACCEPTED',
  SCHEDULED = 'SCHEDULED',
  RECHAZADA = 'RECHAZADA',
  MUESTRA_RECOLECTADA = 'MUESTRA_RECOLECTADA',
  EN_ANALISIS = 'EN_ANALISIS',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export enum ConsentStatus {
  PENDIENTE_FIRMA_MEDICO = 'PENDIENTE_FIRMA_MEDICO',
  FIRMADO_MEDICO = 'FIRMADO_MEDICO',
  ENVIADO_PACIENTE = 'ENVIADO_PACIENTE',
  ACEPTADO = 'ACEPTADO',
  RECHAZADO = 'RECHAZADO',
}

export enum DocumentType {
  DNI = 'DNI',
  PASAPORTE = 'PASAPORTE',
  CE = 'CE',
  NIT = 'NIT',
}

export enum Priority {
  URGENTE = 'URGENTE',
  NORMAL = 'NORMAL',
  RUTINA = 'RUTINA',
}

export enum AppointmentStatus {
  PROGRAMADA = 'PROGRAMADA',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA',
}

/**
 * Etiquetas en español para mostrar en la UI
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDIENTE]: 'Pendiente',
  [OrderStatus.CONSENT_PENDING]: 'Consentimiento pendiente',
  [OrderStatus.ACCEPTED]: 'Aceptada',
  [OrderStatus.SCHEDULED]: 'Agendada',
  [OrderStatus.RECHAZADA]: 'Rechazada',
  [OrderStatus.MUESTRA_RECOLECTADA]: 'Muestra recolectada',
  [OrderStatus.EN_ANALISIS]: 'En análisis',
  [OrderStatus.COMPLETADA]: 'Completada',
  [OrderStatus.CANCELADA]: 'Cancelada',
};

export const CONSENT_STATUS_LABELS: Record<ConsentStatus, string> = {
  [ConsentStatus.PENDIENTE_FIRMA_MEDICO]: 'Pendiente firma médico',
  [ConsentStatus.FIRMADO_MEDICO]: 'Firmado por médico',
  [ConsentStatus.ENVIADO_PACIENTE]: 'Enviado al paciente',
  [ConsentStatus.ACEPTADO]: 'Aceptado',
  [ConsentStatus.RECHAZADO]: 'Rechazado',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.URGENTE]: 'Urgente',
  [Priority.NORMAL]: 'Normal',
  [Priority.RUTINA]: 'Rutina',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PROGRAMADA]: 'Programada',
  [AppointmentStatus.CONFIRMADA]: 'Confirmada',
  [AppointmentStatus.CANCELADA]: 'Cancelada',
  [AppointmentStatus.COMPLETADA]: 'Completada',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.DNI]: 'DNI',
  [DocumentType.PASAPORTE]: 'Pasaporte',
  [DocumentType.CE]: 'C.E.',
  [DocumentType.NIT]: 'NIT',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.OPERADOR]: 'Operador',
  [UserRole.LABORATORIO]: 'Laboratorio',
  [UserRole.MEDICO]: 'Médico',
};
