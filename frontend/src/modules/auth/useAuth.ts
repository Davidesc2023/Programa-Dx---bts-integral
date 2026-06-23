'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './authStore';
import { setUserSession, clearUserSession } from '@/lib/token';
import { loginRequest, logoutRequest } from '@/services/auth.service';
import type { LoginPayload } from '@/services/auth.service';
import { UserRole } from '@/types/enums';

export function useAuth() {
  const { user, isAuthenticated, setUser, clearUser } = useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { user: loginUser } = await loginRequest(payload);
      setUser({ id: loginUser.id, email: loginUser.email, role: loginUser.role });
      setUserSession({ id: loginUser.id, email: loginUser.email, role: loginUser.role });
      const destination =
        loginUser.role === UserRole.PACIENTE ? '/portal/dashboard' : '/dx/dashboard';
      router.push(destination);
    },
    [router, setUser],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignorar errores de logout en el servidor
    } finally {
      clearUserSession();
      clearUser();
      router.push('/login');
    }
  }, [router, clearUser]);

  return { user, isAuthenticated, login, logout };
}
