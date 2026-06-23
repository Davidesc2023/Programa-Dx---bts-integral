'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/modules/auth/authStore';
import { getUserSession, setUserSession } from '@/lib/token';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserRole } from '@/types/enums';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === UserRole.PACIENTE) router.replace('/portal/dashboard');
      return;
    }

    // Rehydración rápida desde sessionStorage
    const session = getUserSession();
    if (session) {
      setUser({ id: session.id, email: session.email, role: session.role as UserRole });
      if (session.role === UserRole.PACIENTE) router.replace('/portal/dashboard');
      return;
    }

    // Sin sesión local → verificar con el servidor (cookie enviada automáticamente)
    api
      .get<{ data: { id: string; email: string; role: UserRole } }>('/auth/me')
      .then(({ data }) => {
        const u = data.data;
        setUser({ id: u.id, email: u.email, role: u.role });
        setUserSession({ id: u.id, email: u.email, role: u.role });
        if (u.role === UserRole.PACIENTE) router.replace('/portal/dashboard');
      })
      .catch(() => router.replace('/login'));
  }, [isAuthenticated, user, router, setUser]);

  if (!isAuthenticated) return null;

  return <AppLayout>{children}</AppLayout>;
}
