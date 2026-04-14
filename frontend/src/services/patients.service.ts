import { api as apiClient } from './api';
import type { PaginatedApiResponse, ApiResponse, Patient } from '@/types/api.types';
import type { PaginationQuery } from '@/types/api.types';
import type { PatientFormValues } from '@/lib/validators';

export interface PatientQuery extends PaginationQuery {
  search?: string;
}

export async function getPatients(
  query: PatientQuery = {},
): Promise<PaginatedApiResponse<Patient>> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);

  const { data } = await apiClient.get<PaginatedApiResponse<Patient>>(
    `/patients?${params.toString()}`,
  );
  return data;
}

export async function getPatientById(id: string): Promise<Patient> {
  const { data } = await apiClient.get<{ data: Patient }>(`/patients/${id}`);
  return data.data;
}

export async function createPatient(payload: PatientFormValues): Promise<Patient> {
  const { data } = await apiClient.post<ApiResponse<Patient>>('/patients', payload);
  return data.data;
}

export async function updatePatient(
  id: string,
  payload: Partial<PatientFormValues>,
): Promise<Patient> {
  const { data } = await apiClient.patch<ApiResponse<Patient>>(`/patients/${id}`, payload);
  return data.data;
}

export async function deletePatient(id: string): Promise<void> {
  await apiClient.delete(`/patients/${id}`);
}
