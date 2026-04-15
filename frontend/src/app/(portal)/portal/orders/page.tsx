'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { getPortalOrders } from '@/services/portal.service';
import type { Order } from '@/types/api.types';
import { getApiErrorMessage } from '@/services/api';
import { ORDER_STATUS_LABELS } from '@/types/enums';

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortalOrders()
      .then(setOrders)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Mis órdenes</h1>
      <p className="text-sm text-gray-500 mb-6">Historial de órdenes de laboratorio</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Cargando órdenes...</p>}

      {!loading && orders.length === 0 && !error && (
        <p className="text-sm text-gray-500">No tienes órdenes registradas aún.</p>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/portal/orders/${order.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Orden #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                  {order.diagnosis ? ` — ${order.diagnosis}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={order.status} />
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDIENTE: 'bg-gray-100 text-gray-700',
    CONSENT_PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-blue-100 text-blue-700',
    SCHEDULED: 'bg-indigo-100 text-indigo-700',
    RECHAZADA: 'bg-red-100 text-red-700',
    MUESTRA_RECOLECTADA: 'bg-purple-100 text-purple-700',
    EN_ANALISIS: 'bg-orange-100 text-orange-700',
    COMPLETADA: 'bg-green-100 text-green-700',
    CANCELADA: 'bg-gray-100 text-gray-400',
  };

  const label = (ORDER_STATUS_LABELS as Record<string, string>)[status] ?? status;
  const colorClass = colors[status] ?? 'bg-gray-100 text-gray-600';

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
      {label}
    </span>
  );
}
