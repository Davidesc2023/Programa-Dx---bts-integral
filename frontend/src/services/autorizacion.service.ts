import axios from 'axios';
import type { AutorizacionRespuesta } from '@/types/dx.types';

// Separate instance — no JWT interceptor, no 401 redirect
const api = axios.create({ baseURL: '/api' });

interface ApiEnvelope<T> {
  data: T;
  message: string;
}

export interface ResponderPayload {
  respuesta: 'AUTORIZADO' | 'NO_AUTORIZADO';
  nombre_firmado: string;
  correccion_datos?: string;
}

export async function responderAutorizacion(
  token: string,
  payload: ResponderPayload,
): Promise<ApiEnvelope<AutorizacionRespuesta>> {
  const res = await api.post<ApiEnvelope<AutorizacionRespuesta>>(
    `/autorizar/${token}`,
    payload,
  );
  return res.data;
}
