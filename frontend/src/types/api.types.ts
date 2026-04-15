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
  city: string | null;
  address: string | null;
  insurance: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  userId?: string | null;
}

// ─── Portal Dashboard ─────────────────────────────────────────────────────────

export interface PortalDashboard {
  activeOrders: number;
  pendingConsents: number;
  availableResults: number;
  nextAppointment: Appointment | null;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string | null;
  doctor?: Pick<User, 'id' | 'email' | 'role' | 'firstName' | 'lastName' | 'specialty' | 'medicalLicense'>;
  physician: string | null;
  diagnosis: string | null;
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
  // Legacy compatibility fields (kept for existing UI code)
  signedBy: string | null;
  signedAt: string | null;
  patientResponse: string | null;
  respondedAt: string | null;
  // v13 — legal fields
  doctorNameSnapshot: string | null;
  patientNameSnapshot: string | null;
  patientSignedAt: string | null;
  accepted: boolean | null;
  documentHtml: string | null;
  documentPdfUrl: string | null;
  notes: string | null;
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
  firstName: string | null;
  lastName: string | null;
  documentType: DocumentType | null;
  documentNumber: string | null;
  phone: string | null;
  specialty: string | null;
  medicalLicense: string | null;
  patientId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination query ─────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
