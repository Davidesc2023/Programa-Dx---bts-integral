import { api as apiClient } from './api';
import type {
  ApiResponse,
  Appointment,
  Consent,
  Order,
  Patient,
  PortalDashboard,
  Result,
  User,
} from '@/types/api.types';

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface PortalMeResponse {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  patientProfile: Patient | null;
}

export async function getPortalMe(): Promise<PortalMeResponse> {
  const { data } = await apiClient.get<ApiResponse<PortalMeResponse>>('/portal/me');
  return data.data;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getPortalDashboard(): Promise<PortalDashboard> {
  const { data } = await apiClient.get<ApiResponse<PortalDashboard>>('/portal/dashboard');
  return data.data;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getPortalOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<ApiResponse<Order[]>>('/portal/orders');
  return data.data;
}

export async function getPortalOrderById(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<ApiResponse<Order>>(`/portal/orders/${orderId}`);
  return data.data;
}

// ─── Consents ────────────────────────────────────────────────────────────────

export async function getPortalConsentForOrder(orderId: string): Promise<Consent> {
  const { data } = await apiClient.get<ApiResponse<Consent>>(
    `/portal/orders/${orderId}/consent`,
  );
  return data.data;
}

export async function acceptPortalConsent(
  consentId: string,
  notes?: string,
): Promise<Consent> {
  const { data } = await apiClient.post<ApiResponse<Consent>>(
    `/portal/consents/${consentId}/accept`,
    { notes },
  );
  return data.data;
}

export async function rejectPortalConsent(
  consentId: string,
  notes?: string,
): Promise<Consent> {
  const { data } = await apiClient.post<ApiResponse<Consent>>(
    `/portal/consents/${consentId}/reject`,
    { notes },
  );
  return data.data;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export async function getPortalResults(): Promise<Result[]> {
  const { data } = await apiClient.get<ApiResponse<Result[]>>('/portal/results');
  return data.data;
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getPortalAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get<ApiResponse<Appointment[]>>('/portal/appointments');
  return data.data;
}
