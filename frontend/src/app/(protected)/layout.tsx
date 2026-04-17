'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, decodeJwtPayload, isTokenExpired } from '@/lib/token';
import { useAuthStore } from '@/modules/auth/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserRole } from '@/types/enums';
import type { JwtPayload } from '@/types/api.types';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, setUserFromToken } = useAuthStore();

  useEffect(() => {
    const token = getAccessToken();

    if (!token || isTokenExpired(token)) {
      router.replace('/login');
      return;
    }

    if (!isAuthenticated) {
      setUserFromToken(token);
    }

    // PACIENTE no debe acceder al panel de staff — redirigir al portal
    const payload = decodeJwtPayload<JwtPayload>(token);
    if (payload?.role === UserRole.PACIENTE) {
      router.replace('/portal/dashboard');
    }
  }, [isAuthenticated, router, setUserFromToken]);

  if (!isAuthenticated) {
    // Evitar flash de contenido protegido
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
