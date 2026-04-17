'use client';

import { FileText, ExternalLink, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/services/orders.service';
import { getConsentByOrder } from '@/services/consents.service';
import { Card, CardHeader } from '@/components/ui/Card';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConsentStatus } from '@/types/enums';

type DoctorStatus = 'pending' | 'signed';
type PatientStatus = 'na' | 'pending_send' | 'awaiting' | 'accepted' | 'rejected';

function getDoctorStatus(status: ConsentStatus): DoctorStatus {
  return status === ConsentStatus.PENDIENTE_FIRMA_MEDICO ? 'pending' : 'signed';
}
function getPatientStatus(status: ConsentStatus): PatientStatus {
  if (status === ConsentStatus.PENDIENTE_FIRMA_MEDICO) return 'na';
  if (status === ConsentStatus.FIRMADO_MEDICO)         return 'pending_send';
  if (status === ConsentStatus.ENVIADO_PACIENTE)       return 'awaiting';
  if (status === ConsentStatus.ACEPTADO)               return 'accepted';
  if (status === ConsentStatus.RECHAZADO)              return 'rejected';
  return 'na';
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

function DoctorBadge({ status, signedAt }: { status: DoctorStatus; signedAt?: string | null }) {
  if (status === 'pending')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(208,166,0,0.12)', color: '#745b00' }}>
        <Clock size={11} />Pendiente firma
      </span>
    );
  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(27,122,107,0.10)', color: '#006053' }}>
        <CheckCircle2 size={11} />Firmado
      </span>
      {signedAt && <p className="text-xs pl-1" style={{ color: '#6e7976' }}>{fmt(signedAt)}</p>}
    </div>
  );
}

function PatientBadge({ status, respondedAt }: { status: PatientStatus; respondedAt?: string | null }) {
  if (status === 'na')
    return <span className="text-xs" style={{ color: '#bec9c5' }}>—</span>;
  if (status === 'pending_send')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: '#f2f4f4', color: '#6e7976' }}>
        <AlertCircle size={11} />Pendiente envío
      </span>
    );
  if (status === 'awaiting')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(0,97,163,0.10)', color: '#0061a3' }}>
        <Clock size={11} />Esperando respuesta
      </span>
    );
  if (status === 'accepted')
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(27,122,107,0.10)', color: '#006053' }}>
          <CheckCircle2 size={11} />Aceptado
        </span>
        {respondedAt && <p className="text-xs pl-1" style={{ color: '#6e7976' }}>{fmt(respondedAt)}</p>}
      </div>
    );
  // rejected
  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(186,26,26,0.10)', color: '#ba1a1a' }}>
        <XCircle size={11} />Rechazado
      </span>
      {respondedAt && <p className="text-xs pl-1" style={{ color: '#6e7976' }}>{fmt(respondedAt)}</p>}
    </div>
  );
}

function OrderConsentRow({ orderId, orderCode }: { orderId: string; orderCode: string }) {
  const { data: consent, isLoading } = useQuery({
    queryKey: ['consent', orderId],
    queryFn: () => getConsentByOrder(orderId),
    retry: false,
    staleTime: 30_000,
  });

  const status       = consent?.status as ConsentStatus | undefined;
  const doctorStatus = status ? getDoctorStatus(status) : null;
  const patientStatus = status ? getPatientStatus(status) : null;

  return (
    <tr className="border-t transition-colors"
      style={{ borderColor: '#e6e8e9' }}>
      <td className="py-3 px-4 text-sm font-mono font-medium" style={{ color: '#191c1d' }}>
        {orderCode}
      </td>

      {/* Paso 1: Firma médica */}
      <td className="py-3 px-4">
        {isLoading ? (
          <span className="text-xs" style={{ color: '#bec9c5' }}>…</span>
        ) : !consent ? (
          <span className="text-xs" style={{ color: '#bec9c5' }}>…</span>
        ) : (
          <DoctorBadge status={doctorStatus!} signedAt={consent.signedAt} />
        )}
      </td>

      {/* Paso 2: Respuesta paciente */}
      <td className="py-3 px-4">
        {isLoading ? (
          <span className="text-xs" style={{ color: '#bec9c5' }}>…</span>
        ) : !consent ? (
          <span className="text-xs" style={{ color: '#bec9c5' }}>—</span>
        ) : (
          <PatientBadge status={patientStatus!} respondedAt={consent.patientSignedAt ?? consent.respondedAt} />
        )}
      </td>

      <td className="py-3 px-4">
        <Link href={`/orders/${orderId}`}
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: '#1B7A6B' }}>
          Ver orden <ExternalLink size={11} />
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
        <FileText size={24} style={{ color: '#1B7A6B' }} />
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#191c1d' }}>Consentimientos</h1>
          <p className="text-sm" style={{ color: '#6e7976' }}>
            Seguimiento de las 2 firmas por orden médica
          </p>
        </div>
      </div>

      <Card padding="none">
        <CardHeader
          title="Todas las órdenes"
          description="Para gestionar un consentimiento, ingresa al detalle de la orden."
        />
        {isLoading ? (
          <div className="p-4"><TableSkeleton rows={6} cols={4} /></div>
        ) : isError ? (
          <p className="px-4 py-6 text-sm" style={{ color: '#ba1a1a' }}>Error al cargar órdenes.</p>
        ) : orders.length === 0 ? (
          <p className="px-4 py-6 text-sm" style={{ color: '#6e7976' }}>
            No hay órdenes registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f2f4f4' }}>
                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#6e7976' }}>Código orden</th>
                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#6e7976' }}>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full text-center leading-4 text-xs"
                        style={{ background: 'rgba(208,166,0,0.15)', color: '#745b00' }}>1</span>
                      Firma médica
                    </span>
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#6e7976' }}>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full text-center leading-4 text-xs"
                        style={{ background: 'rgba(27,122,107,0.15)', color: '#1B7A6B' }}>2</span>
                      Respuesta paciente
                    </span>
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#6e7976' }}>Acciones</th>
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