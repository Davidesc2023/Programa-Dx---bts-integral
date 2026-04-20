'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAccessToken, decodeJwtPayload, isTokenExpired } from '@/lib/token';
import { useAuthStore } from '@/modules/auth/authStore';
import { getPortalDashboard } from '@/services/portal.service';
import { UserRole } from '@/types/enums';
import type { JwtPayload } from '@/types/api.types';
import { NotificationBell } from '@/components/ui/NotificationBell';

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

  const { data: dashboardData } = useQuery({
    queryKey: ['portal-dashboard-nav'],
    queryFn: getPortalDashboard,
    enabled: isAuthenticated && user?.role === UserRole.PACIENTE,
    staleTime: 30_000,
  });

  const pendingConsents = dashboardData?.pendingConsents ?? 0;
  const availableResults = dashboardData?.availableResults ?? 0;

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
            <a href="/portal/orders" className="relative hover:text-primary-600 transition-colors">
              Mis Órdenes
              {pendingConsents > 0 && (
                <span className="absolute -top-2 -right-3 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {pendingConsents}
                </span>
              )}
            </a>
            <a href="/portal/results" className="relative hover:text-primary-600 transition-colors">
              Resultados
              {availableResults > 0 && (
                <span className="absolute -top-2 -right-3 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-green-500 text-white text-[10px] font-bold">
                  {availableResults}
                </span>
              )}
            </a>
            <a href="/portal/appointments" className="hover:text-primary-600 transition-colors">
              Citas
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <NotificationBell isPortal />
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
