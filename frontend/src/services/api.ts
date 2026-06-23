import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearUserSession } from '@/lib/token';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true, // send httpOnly cookies on every request
});

// ─── Token refresh queue (evita race condition con múltiples 401 simultáneos) ──

let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

function drainQueue(success: boolean) {
  refreshQueue.forEach((cb) => cb(success));
  refreshQueue = [];
}

async function attemptRefresh(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    // No body needed — proxy reads the refresh cookie and injects it for us
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      signal: controller.signal,
    });
    clearTimeout(tid);
    return res.ok; // proxy sets new cookies on 200
  } catch {
    return false;
  }
}

// ─── Response interceptor: 401 → intentar refresh una sola vez ───────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthRoute =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((success) => {
            if (!success) return reject(error);
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      const refreshed = await attemptRefresh();
      isRefreshing = false;
      drainQueue(refreshed);

      if (refreshed) {
        return api(originalRequest);
      }

      // Refresh falló → limpiar sesión y redirigir
      clearUserSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (error.message) return error.message;
  }
  return 'Ha ocurrido un error inesperado';
}
