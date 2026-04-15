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
        style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15' }}>
        <Clock size={11} />Pendiente firma
      </span>
    );
  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
        <CheckCircle2 size={11} />Firmado
      </span>
      {signedAt && <p className="text-xs pl-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{fmt(signedAt)}</p>}
    </div>
  );
}

function PatientBadge({ status, respondedAt }: { status: PatientStatus; respondedAt?: string | null }) {
  if (status === 'na')
    return <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>;
  if (status === 'pending_send')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
        <AlertCircle size={11} />Pendiente envío
      </span>
    );
  if (status === 'awaiting')
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(147,197,253,0.1)', color: '#93c5fd' }}>
        <Clock size={11} />Esperando respuesta
      </span>
    );
  if (status === 'accepted')
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
          <CheckCircle2 size={11} />Aceptado
        </span>
        {respondedAt && <p className="text-xs pl-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{fmt(respondedAt)}</p>}
      </div>
    );
  // rejected
  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
        <XCircle size={11} />Rechazado
      </span>
      {respondedAt && <p className="text-xs pl-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{fmt(respondedAt)}</p>}
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
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <td className="py-3 px-4 text-sm font-mono font-medium" style={{ color: '#e2e8f0' }}>
        {orderCode}
      </td>

      {/* Paso 1: Firma médica */}
      <td className="py-3 px-4">
        {isLoading ? (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>…</span>
        ) : !consent ? (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Sin consentimiento</span>
        ) : (
          <DoctorBadge status={doctorStatus!} signedAt={consent.signedAt} />
        )}
      </td>

      {/* Paso 2: Respuesta paciente */}
      <td className="py-3 px-4">
        {isLoading ? (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>…</span>
        ) : !consent ? (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
        ) : (
          <PatientBadge status={patientStatus!} respondedAt={consent.patientSignedAt ?? consent.respondedAt} />
        )}
      </td>

      <td className="py-3 px-4">
        <Link href={`/orders/${orderId}`}
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: '#4ade80' }}>
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
        <FileText size={24} style={{ color: '#4ade80' }} />
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#e2e8f0' }}>Consentimientos</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
          <p className="px-4 py-6 text-sm" style={{ color: '#f87171' }}>Error al cargar órdenes.</p>
        ) : orders.length === 0 ? (
          <p className="px-4 py-6 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No hay órdenes registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>Código orden</th>
                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full text-center leading-4 text-xs"
                        style={{ background: 'rgba(250,204,21,0.2)', color: '#facc15' }}>1</span>
                      Firma médica
                    </span>
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full text-center leading-4 text-xs"
                        style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80' }}>2</span>
                      Respuesta paciente
                    </span>
                  </th>
                  <th className="py-2 px-4 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>Acciones</th>
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