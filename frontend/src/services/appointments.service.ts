import { api } from './api';
import type { Appointment, ApiResponse } from '@/types/api.types';
import type { PaginatedApiResponse } from '@/types/api.types';
import type { AppointmentStatus } from '@/types/enums';

export interface GetAppointmentsParams {
  page?: number;
  limit?: number;
  patientId?: string;
  orderId?: string;
}

export interface CreateAppointmentPayload {
  patientId: string;
  orderId?: string;
  scheduledAt: string; // ISO string
  notes?: string;
}

export interface UpdateAppointmentPayload {
  patientId?: string;
  orderId?: string;
  scheduledAt?: string;
  notes?: string;
}

export async function getAppointments(
  params: GetAppointmentsParams = {},
): Promise<PaginatedApiResponse<Appointment>> {
  const { data } = await api.get<PaginatedApiResponse<Appointment>>('/appointments', { params });
  return data;
}

export async function getAppointmentById(id: string): Promise<Appointment> {
  const { data } = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
  return data.data;
}

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const { data } = await api.post<ApiResponse<Appointment>>('/appointments', payload);
  return data.data;
}

export async function updateAppointment(
  id: string,
  payload: UpdateAppointmentPayload,
): Promise<Appointment> {
  const { data } = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}`, payload);
  return data.data;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const { data } = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status });
  return data.data;
}

export async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}
