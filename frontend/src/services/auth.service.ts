import { api } from '@/services/api';
import type { ApiResponse, LoginResponse, RegisterResponse } from '@/types/api.types';
import type { DocumentType } from '@/types/enums';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPatientPayload {
  email: string;
  password: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName?: string;
  lastName?: string;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  return response.data.data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

export async function registerPatientRequest(
  payload: RegisterPatientPayload,
): Promise<RegisterResponse> {
  const response = await api.post<ApiResponse<RegisterResponse>>(
    '/auth/register-patient',
    payload,
  );
  return response.data.data;
}
