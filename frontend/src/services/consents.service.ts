import { api as apiClient } from './api';
import type { ApiResponse, Consent } from '@/types/api.types';

export async function getConsentByOrder(orderId: string): Promise<Consent> {
  const { data } = await apiClient.get<ApiResponse<Consent>>(
    `/orders/${orderId}/consent`,
  );
  return data.data;
}

export async function createConsent(orderId: string): Promise<Consent> {
  const { data } = await apiClient.post<ApiResponse<Consent>>(
    `/orders/${orderId}/consent`,
    {},
  );
  return data.data;
}

export async function signConsent(
  orderId: string,
  payload?: { notes?: string; signatureDataUrl?: string | null },
): Promise<Consent> {
  const { data } = await apiClient.patch<ApiResponse<Consent>>(
    `/orders/${orderId}/consent/sign`,
    payload ?? {},
  );
  return data.data;
}

export async function sendConsent(orderId: string): Promise<Consent> {
  const { data } = await apiClient.patch<ApiResponse<Consent>>(
    `/orders/${orderId}/consent/send`,
    {},
  );
  return data.data;
}

export async function respondConsent(
  orderId: string,
  response: 'ACEPTADO' | 'RECHAZADO',
): Promise<Consent> {
  const { data } = await apiClient.patch<ApiResponse<Consent>>(
    `/orders/${orderId}/consent/respond`,
    { response },
  );
  return data.data;
}
