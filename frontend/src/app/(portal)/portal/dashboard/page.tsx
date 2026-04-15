'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, FileText, Calendar, AlertCircle } from 'lucide-react';
import { getPortalDashboard } from '@/services/portal.service';
import type { PortalDashboard } from '@/types/api.types';
import { getApiErrorMessage } from '@/services/api';
import { useAuthStore } from '@/modules/auth/authStore';

export default function PortalDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortalDashboard()
      .then(setDashboard)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">
        Bienvenido{user?.email ? `, ${user.email}` : ''}
      </h1>
      <p className="text-sm text-gray-500 mb-8">Resumen de tu estado actual</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<ClipboardList size={20} className="text-blue-500" />}
            label="Órdenes activas"
            value={dashboard.activeOrders}
            href="/portal/orders"
          />
          <StatCard
            icon={<FileText size={20} className="text-orange-500" />}
            label="Consentimientos pendientes"
            value={dashboard.pendingConsents}
            href="/portal/orders"
          />
          <StatCard
            icon={<FileText size={20} className="text-green-500" />}
            label="Resultados disponibles"
            value={dashboard.availableResults}
            href="/portal/results"
          />
        </div>
      )}

      {dashboard?.nextAppointment && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Calendar size={16} />
            Próxima cita
          </h2>
          <p className="text-gray-800 text-sm">
            {new Date(dashboard.nextAppointment.scheduledAt).toLocaleString('es-CO', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
          {dashboard.nextAppointment.notes && (
            <p className="text-gray-500 text-xs mt-1">{dashboard.nextAppointment.notes}</p>
          )}
          <Link
            href="/portal/appointments"
            className="text-xs text-primary-600 hover:underline mt-2 inline-block"
          >
            Ver todas las citas →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </Link>
  );
}
