'use client';

import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/services/orders.service';
import { getConsentByOrder } from '@/services/consents.service';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { CONSENT_STATUS_LABELS, ConsentStatus } from '@/types/enums';
import type { BadgeVariant } from '@/components/ui/Badge';

const STATUS_BADGE: Record<ConsentStatus, BadgeVariant> = {
  [ConsentStatus.PENDIENTE_FIRMA_MEDICO]: 'warning',
  [ConsentStatus.FIRMADO_MEDICO]: 'info',
  [ConsentStatus.ENVIADO_PACIENTE]: 'purple',
  [ConsentStatus.ACEPTADO]: 'success',
  [ConsentStatus.RECHAZADO]: 'danger',
};

function OrderConsentRow({ orderId, orderCode }: { orderId: string; orderCode: string }) {
  const { data: consent, isLoading } = useQuery({
    queryKey: ['consent', orderId],
    queryFn: () => getConsentByOrder(orderId),
    retry: false,
    staleTime: 30_000,
  });

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 text-sm font-medium text-gray-900">{orderCode}</td>
      <td className="py-3 px-4 text-sm">
        {isLoading ? (
          <span className="text-gray-400 text-xs">Cargando…</span>
        ) : consent ? (
          <Badge variant={STATUS_BADGE[consent.status as ConsentStatus]}>
            {CONSENT_STATUS_LABELS[consent.status as ConsentStatus]}
          </Badge>
        ) : (
          <Badge variant="default">Sin consentimiento</Badge>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {consent?.signedAt
          ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'short' }).format(new Date(consent.signedAt))
          : '—'}
      </td>
      <td className="py-3 px-4">
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver orden <ExternalLink size={12} />
        </Link>
      </td>
    </tr>
  );
}

export default function ConsentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', { page: 1 }],
    queryFn: () => getOrders({ page: 1, limit: 50 }),
    staleTime: 30_000,
  });

  const orders = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="text-primary-600" size={24} />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Consentimientos</h1>
          <p className="text-sm text-gray-500">Estado del consentimiento por orden médica</p>
        </div>
      </div>

      <Card padding="none">
        <CardHeader
          title="Todas las órdenes"
          description="Para gestionar el consentimiento de una orden, ingresa al detalle de la orden."
        />
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={4} />
          </div>
        ) : isError ? (
          <p className="px-4 py-6 text-sm text-red-500">Error al cargar órdenes.</p>
        ) : orders.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">No hay órdenes registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Código orden
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Estado consentimiento
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Fecha firma
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderConsentRow
                    key={order.id}
                    orderId={order.id}
                    orderCode={order.id.slice(0, 8).toUpperCase()}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
