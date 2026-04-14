/**
 * Tipos de respuesta de la API del backend (NestJS APP-DX)
 * Refleja el envelope uniforme { data, message, statusCode }
 */

import type {
  AppointmentStatus,
  ConsentStatus,
  DocumentType,
  OrderStatus,
  Priority,
  UserRole,
} from './enums';

// ─── Envelope genérico ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
  statusCode: number;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: UserRole;
}

// ─── User payload del JWT ─────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: string;
  phone: string;
  email: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string | null;
  physician: string | null;
  priority: Priority;
  status: OrderStatus;
  observations: string | null;
  estimatedCompletionDate: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  tests?: OrderTest[];
}

export interface OrderTest {
  id: string;
  orderId: string;
  name: string;
  createdAt: string;
}

// ─── Consents ─────────────────────────────────────────────────────────────────

export interface Consent {
  id: string;
  orderId: string;
  status: ConsentStatus;
  signedBy: string | null;
  signedAt: string | null;
  patientResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Results ──────────────────────────────────────────────────────────────────

export interface Result {
  id: string;
  orderId: string;
  examType: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  attachments?: ResultAttachment[];
}

export interface ResultAttachment {
  id: string;
  resultId: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  patientId: string;
  orderId: string | null;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination query ─────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
