'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, isTokenExpired } from '@/lib/token';
import { useAuthStore } from '@/modules/auth/authStore';
import { AppLayout } from '@/components/layout/AppLayout';

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
  }, [isAuthenticated, router, setUserFromToken]);

  if (!isAuthenticated) {
    // Evitar flash de contenido protegido
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
