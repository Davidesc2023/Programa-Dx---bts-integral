import axios from 'axios';
import type { CrearCasoPayload, CrearCasoResponse, PublicFormData } from '@/types/dx.types';

// Separate instance — no JWT interceptor, no 401 redirect
const api = axios.create({ baseURL: '/api' });

interface ApiEnvelope<T> {
  data: T;
  message: string;
}

export async function getPublicFormData(tenantSlug: string, programa: string): Promise<PublicFormData> {
  const res = await api.get<ApiEnvelope<PublicFormData>>(`/public/${tenantSlug}/${programa}`);
  return res.data.data;
}

export async function publicCrearCaso(
  tenantSlug: string,
  programa: string,
  payload: CrearCasoPayload,
): Promise<ApiEnvelope<CrearCasoResponse>> {
  const res = await api.post<ApiEnvelope<CrearCasoResponse>>(
    `/public/${tenantSlug}/${programa}`,
    payload,
  );
  return res.data;
}

export async function publicSubirResultadoPrevio(
  tenantSlug: string,
  programa: string,
  casoId: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  // axios sets Content-Type: multipart/form-data with boundary automatically
  await api.post(`/public/${tenantSlug}/${programa}/upload?casoId=${casoId}`, formData);
}
