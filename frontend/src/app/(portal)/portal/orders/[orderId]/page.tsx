'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, AlertCircle, FileText } from 'lucide-react';
import { getPortalOrderById } from '@/services/portal.service';
import type { Order } from '@/types/api.types';
import { getApiErrorMessage } from '@/services/api';
import { ORDER_STATUS_LABELS, ConsentStatus } from '@/types/enums';

export default function PortalOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortalOrderById(orderId)
      .then(setOrder)
      .catch((e) => setError(getApiErrorMessage(e)));
  }, [orderId]);

  const consent = order?.consent;
  const consentPending =
    consent?.status === ConsentStatus.ENVIADO_PACIENTE ||
    consent?.status === ConsentStatus.FIRMADO_MEDICO;

  return (
    <div>
      <Link
        href="/portal/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft size={16} />
        Volver a órdenes
      </Link>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!order && !error && <p className="text-sm text-gray-500">Cargando...</p>}

      {order && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  Orden #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('es-CO', { dateStyle: 'full' })}
                </p>
              </div>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                {(ORDER_STATUS_LABELS as Record<string, string>)[order.status] ?? order.status}
              </span>
            </div>

            {order.diagnosis && (
              <p className="mt-3 text-sm text-gray-700">
                <span className="font-medium">Diagnóstico:</span> {order.diagnosis}
              </p>
            )}
            {order.observations && (
              <p className="mt-1 text-sm text-gray-700">
                <span className="font-medium">Observaciones:</span> {order.observations}
              </p>
            )}
          </div>

          {/* Consent alert */}
          {consentPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <FileText size={18} className="text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Tienes un consentimiento informado pendiente de firma.
                </p>
                <Link
                  href={`/portal/orders/${order.id}/consent`}
                  className="text-sm text-yellow-700 hover:underline mt-1 inline-block"
                >
                  Ver y responder consentimiento →
                </Link>
              </div>
            </div>
          )}

          {/* Tests */}
          {order.tests && order.tests.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Exámenes solicitados</h2>
              <ul className="space-y-1">
                {order.tests.map((t) => (
                  <li key={t.id} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
