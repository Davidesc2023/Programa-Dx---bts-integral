import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearTokens, getAccessToken } from '@/lib/token';

// Call the Railway backend directly from the browser.
// NEXT_PUBLIC_BACKEND_URL is baked at build time; fallback is the known Railway URL.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'https://programa-dx-bts-integral-production.up.railway.app';

export const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─── Request interceptor: adjuntar JWT ───────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Response interceptor: manejar 401 globalmente ───────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido → limpiar sesión y redirigir a login
      clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Helper para extraer el mensaje de error de la respuesta del backend
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string') return data.message;
    if (error.message) return error.message;
  }
  return 'Ha ocurrido un error inesperado';
}
