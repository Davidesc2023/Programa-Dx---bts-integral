'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, decodeJwtPayload, isTokenExpired } from '@/lib/token';
import { useAuthStore } from '@/modules/auth/authStore';
import { UserRole } from '@/types/enums';
import type { JwtPayload } from '@/types/api.types';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, setUserFromToken } = useAuthStore();

  useEffect(() => {
    const token = getAccessToken();

    if (!token || isTokenExpired(token)) {
      router.replace('/login');
      return;
    }

    if (!isAuthenticated) {
      setUserFromToken(token);
    }

    const payload = decodeJwtPayload<JwtPayload>(token);
    if (payload?.role !== UserRole.PACIENTE) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router, setUserFromToken]);

  if (!isAuthenticated || user?.role !== UserRole.PACIENTE) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portal top navbar */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-800">
            Portal del Paciente
          </span>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="/portal/dashboard" className="hover:text-primary-600 transition-colors">
              Inicio
            </a>
            <a href="/portal/orders" className="hover:text-primary-600 transition-colors">
              Órdenes
            </a>
            <a href="/portal/results" className="hover:text-primary-600 transition-colors">
              Resultados
            </a>
            <a href="/portal/appointments" className="hover:text-primary-600 transition-colors">
              Citas
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {user?.email}
            </span>
            <a
              href="/login"
              className="text-sm text-red-600 hover:underline"
            >
              Salir
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
