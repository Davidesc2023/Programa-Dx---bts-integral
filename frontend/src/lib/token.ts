/**
 * JWT helpers — localStorage
 *
 * ADVERTENCIA DE SEGURIDAD (OWASP A03 — XSS):
 * Almacenar JWT en localStorage expone el token a scripts XSS.
 * Mitigaciones aplicadas en esta app:
 *  1. CSP configurado en next.config.ts
 *  2. Headers X-Content-Type-Options, X-Frame-Options en next.config.ts
 *  3. Nunca renderizar HTML arbitrario sin sanitización
 *  4. No usar dangerouslySetInnerHTML con datos del servidor
 */

const ACCESS_TOKEN_KEY = 'app_dx_access_token';
const REFRESH_TOKEN_KEY = 'app_dx_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Decodifica el payload del JWT sin verificar firma (solo para uso en cliente)
 * La verificación real ocurre en el backend en cada request.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Normalizar Base64URL → Base64 estándar
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
