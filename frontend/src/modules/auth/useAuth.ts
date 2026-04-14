'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './authStore';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  setTokens,
} from '@/lib/token';
import { loginRequest, logoutRequest } from '@/services/auth.service';
import type { LoginPayload } from '@/services/auth.service';

export function useAuth() {
  const { user, isAuthenticated, setUserFromToken, clearUser } = useAuthStore();
  const router = useRouter();

  // Rehydrate user from localStorage token on mount
  useEffect(() => {
    if (isAuthenticated) return;
    const token = getAccessToken();
    if (token && !isTokenExpired(token)) {
      setUserFromToken(token);
    }
  }, [isAuthenticated, setUserFromToken]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const tokens = await loginRequest(payload);
      setTokens(tokens.accessToken, tokens.refreshToken);
      setUserFromToken(tokens.accessToken);
      router.push('/dashboard');
    },
    [router, setUserFromToken],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch {
      // Ignorar errores de logout en el servidor
    } finally {
      clearTokens();
      clearUser();
      router.push('/login');
    }
  }, [router, clearUser]);

  return { user, isAuthenticated, login, logout };
}
