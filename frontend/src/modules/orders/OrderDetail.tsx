'use client';

import { useState, type ReactNode, type FormEvent } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, FlaskConical, User, Clock,
  Stethoscope, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useOrder, useUpdateOrderStatus, useAddOrderTest, useDeleteOrderTest } from './useOrders';
import { getAllowedTransitions } from './orderTransitions';
import { useAuthStore } from '@/modules/auth/authStore';
import { ConsentPanel } from '@/modules/consents/ConsentPanel';
import { ORDER_STATUS_LABELS, PRIORITY_LABELS } from '@/types/enums';
import type { OrderStatus } from '@/types/enums';

const BRAND = '#1B7A6B';

interface OrderDetailProps { orderId: string }

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(iso));
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9eaaa7' }}>{label}</dt>
      <dd className="text-sm font-medium" style={{ color: '#191c1d' }}>{children}</dd>
    </div>
  );
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const { data: order, isLoading, isError } = useOrder(orderId);
  const user = useAuthStore((s) => s.user);
  const statusMutation     = useUpdateOrderStatus(orderId);
  const addTestMutation    = useAddOrderTest(orderId);
  const deleteTestMutation = useDeleteOrderTest(orderId);

  const [newTestName, setNewTestName]     = useState('');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [deleteTestId, setDeleteTestId]   = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card padding="lg">
        <LoadingSkeleton rows={8} />
      </Card>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(186,26,26,0.08)' }}>
          <AlertTriangle size={24} style={{ color: '#ba1a1a' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#ba1a1a' }}>No se pudo cargar la orden.</p>
        <Link href="/orders">
          <button className="text-xs font-semibold hover:underline" style={{ color: BRAND }}>
            Volver al listado
          </button>
        </Link>
      </div>
    );
  }

  const allowedTransitions = user?.role ? getAllowedTransitions(user.role, order.status) : [];

  function handleAddTest(e: FormEvent) {
    e.preventDefault();
    const name = newTestName.trim();
    if (!name) return;
    addTestMutation.mutate(name, { onSuccess: () => setNewTestName('') });
  }

  const patientName = order.patient
    ? `${order.patient.firstName} ${order.patient.lastName}`
    : order.patientId;
  const doctorName = order.doctor?.firstName || order.doctor?.lastName
    ? [order.doctor.firstName, order.doctor.lastName].filter(Boolean).join(' ')
    : (order.physician ?? '—');

  return (
    <>
      <div className="space-y-5 max-w-3xl mx-auto">

        {/* ── Encabezado ── */}
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#f2f4f4]"
              style={{ color: '#6e7976' }}
            >
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h2 className="text-lg font-black" style={{ color: '#191c1d', fontFamily: 'Manrope, sans-serif' }}>
              Orden{' '}
              <span className="font-mono text-base" style={{ color: BRAND }}>
                {order.id.slice(0, 8)}…
              </span>
            </h2>
            <p className="text-xs" style={{ color: '#9eaaa7' }}>Creada el {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* ── Información principal ── */}
        <Card padding="lg">
          {/* Estado + cambio */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <StatusBadge status={order.status} />
            {allowedTransitions.length > 0 && (
              <select
                className="text-sm rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: '#e0e8e5',
                  color: '#3e4946',
                  background: '#f8fafa',
                  fontFamily: 'inherit',
                }}
                defaultValue=""
                onChange={(e) => {
                  const val = e.target.value as OrderStatus;
                  if (val) setPendingStatus(val);
                  e.target.value = '';
                }}
              >
                <option value="" disabled>Cambiar estado…</option>
                {allowedTransitions.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                ))}
              </select>
            )}
          </div>

          {/* Grid de datos */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <InfoRow label="Paciente">
              <span className="flex items-center gap-1.5">
                <User size={14} style={{ color: '#9eaaa7' }} />
                {patientName}
              </span>
            </InfoRow>

            <InfoRow label="Médico solicitante">
              <span className="flex items-center gap-1.5">
                <Stethoscope size={14} style={{ color: '#9eaaa7' }} />
                {doctorName}
                {order.doctor?.specialty && (
                  <span className="text-xs font-normal" style={{ color: '#9eaaa7' }}>· {order.doctor.specialty}</span>
                )}
              </span>
            </InfoRow>

            <InfoRow label="Prioridad">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={
                  order.priority === 'URGENTE'
                    ? { background: 'rgba(186,26,26,0.10)', color: '#ba1a1a' }
                    : { background: 'rgba(27,122,107,0.10)', color: BRAND }
                }
              >
                {order.priority === 'URGENTE' && <AlertTriangle size={11} />}
                {PRIORITY_LABELS[order.priority]}
              </span>
            </InfoRow>

            <InfoRow label="Fecha estimada">
              <span className="flex items-center gap-1.5">
                <Clock size={14} style={{ color: '#9eaaa7' }} />
                {formatDate(order.estimatedCompletionDate)}
              </span>
            </InfoRow>

            <InfoRow label="Última actualización">{formatDate(order.updatedAt)}</InfoRow>

            {order.diagnosis && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9eaaa7' }}>
                  Diagnóstico / Justificación clínica
                </dt>
                <dd className="text-sm rounded-xl px-4 py-3" style={{ color: '#3e4946', background: '#f8fafa', border: '1px solid #e0e8e5' }}>
                  {order.diagnosis}
                </dd>
              </div>
            )}

            {order.observations && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9eaaa7' }}>
                  Observaciones
                </dt>
                <dd className="text-sm rounded-xl px-4 py-3" style={{ color: '#3e4946', background: '#f8fafa', border: '1px solid #e0e8e5' }}>
                  {order.observations}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* ── Consentimiento ── */}
        <ConsentPanel orderId={order.id} />

        {/* ── Exámenes solicitados ── */}
        <Card padding="lg">
          <CardHeader
            title="Exámenes solicitados"
            description={`${(order.tests ?? []).length} examen(es) en esta orden`}
          />

          <div className="space-y-2">
            {(order.tests ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 rounded-xl"
                style={{ background: '#f8fafa', border: '1.5px dashed #bec9c5' }}>
                <FlaskConical size={20} style={{ color: '#bec9c5' }} />
                <p className="text-sm" style={{ color: '#9eaaa7' }}>Sin exámenes agregados.</p>
              </div>
            ) : (
              <ul className="rounded-xl overflow-hidden" style={{ border: '1px solid #e0e8e5' }}>
                {(order.tests ?? []).map((t, idx) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      borderTop: idx > 0 ? '1px solid #f2f4f4' : 'none',
                    }}
                  >
                    <span className="flex items-center gap-2.5 text-sm" style={{ color: '#191c1d' }}>
                      <CheckCircle2 size={14} style={{ color: BRAND }} />
                      {t.examName}
                    </span>
                    <button
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: '#9eaaa7' }}
                      title="Eliminar examen"
                      onClick={() => setDeleteTestId(t.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ba1a1a')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9eaaa7')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Agregar examen */}
            <form onSubmit={handleAddTest} className="flex gap-2 mt-3">
              <input
                type="text"
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
                placeholder="Nombre del examen…"
                className="flex-1 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 transition-all"
                style={{
                  border: '1px solid #e0e8e5',
                  background: '#f8fafa',
                  color: '#191c1d',
                }}
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                loading={addTestMutation.isPending}
                disabled={!newTestName.trim()}
              >
                <Plus size={14} className="mr-1" />Agregar
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* ── Confirmar cambio de estado ── */}
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) {
            statusMutation.mutate(pendingStatus, { onSuccess: () => setPendingStatus(null) });
          }
        }}
        variant="primary"
        title="Confirmar cambio de estado"
        message={pendingStatus ? `¿Cambiar el estado a "${ORDER_STATUS_LABELS[pendingStatus]}"?` : ''}
        confirmLabel="Confirmar"
        loading={statusMutation.isPending}
      />

      {/* ── Confirmar eliminar examen ── */}
      <ConfirmDialog
        open={Boolean(deleteTestId)}
        onClose={() => setDeleteTestId(null)}
        onConfirm={() => {
          if (deleteTestId) {
            deleteTestMutation.mutate(deleteTestId, { onSuccess: () => setDeleteTestId(null) });
          }
        }}
        title="Eliminar examen"
        message="¿Deseas eliminar este examen de la orden?"
        confirmLabel="Eliminar"
        loading={deleteTestMutation.isPending}
      />
    </>
  );
}
