/**
 * Auth token helpers — httpOnly cookies (server) + sessionStorage for user info (client)
 *
 * Tokens (access / refresh) are stored as httpOnly cookies by the Next.js proxy (/api/*).
 * JS cannot read them, which prevents XSS token theft (OWASP A03).
 *
 * sessionStorage stores only non-sensitive user metadata (id, email, role) for fast
 * rehydration without a round-trip. It is cleared when the browser tab closes.
 */

const SESSION_USER_KEY = 'app_dx_user';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export function getUserSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setUserSession(user: SessionUser): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearUserSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_USER_KEY);
}

/**
 * Decodifica el payload de un JWT sin verificar firma.
 * Útil solo para leer datos no-sensibles del token cuando sea necesario.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)) as T;
  } catch {
    return null;
  }
}
