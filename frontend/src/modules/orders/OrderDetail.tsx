'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, ChevronDown } from 'lucide-react';
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

interface OrderDetailProps {
  orderId: string;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const { data: order, isLoading, isError } = useOrder(orderId);
  const user = useAuthStore((s) => s.user);
  const statusMutation = useUpdateOrderStatus(orderId);
  const addTestMutation = useAddOrderTest(orderId);
  const deleteTestMutation = useDeleteOrderTest(orderId);

  const [newTestName, setNewTestName] = useState('');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card padding="lg">
        <LoadingSkeleton rows={8} />
      </Card>
    );
  }

  if (isError || !order) {
    return (
      <p className="text-sm text-red-500 text-center mt-10">
        No se pudo cargar la orden.
      </p>
    );
  }

  const allowedTransitions =
    user?.role ? getAllowedTransitions(user.role, order.status) : [];

  function handleAddTest(e: React.FormEvent) {
    e.preventDefault();
    const name = newTestName.trim();
    if (!name) return;
    addTestMutation.mutate(name, { onSuccess: () => setNewTestName('') });
  }

  return (
    <>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <h2 className="text-lg font-semibold text-gray-900">
            Orden{' '}
            <span className="font-mono text-base text-primary-600">
              {order.id.slice(0, 8)}…
            </span>
          </h2>
        </div>

        {/* Main info */}
        <Card padding="lg">
          <div className="flex items-start justify-between gap-4 mb-5">
            <StatusBadge status={order.status} />
            {allowedTransitions.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="text-sm rounded-lg border border-gray-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value as OrderStatus;
                    if (val) setPendingStatus(val);
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>
                    Cambiar estado…
                  </option>
                  {allowedTransitions.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-gray-400 -ml-6 pointer-events-none" />
              </div>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Paciente</dt>
              <dd className="text-gray-900 font-medium">
                {order.patient
                  ? `${order.patient.firstName} ${order.patient.lastName}`
                  : order.patientId}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Médico</dt>
              <dd className="text-gray-900">
                {order.doctor?.firstName || order.doctor?.lastName
                  ? [order.doctor.firstName, order.doctor.lastName].filter(Boolean).join(' ')
                  : (order.physician ?? '—')}
                {order.doctor?.specialty && (
                  <span className="ml-1.5 text-xs text-gray-400">· {order.doctor.specialty}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Prioridad</dt>
              <dd
                className={
                  order.priority === 'URGENTE'
                    ? 'text-red-600 font-semibold'
                    : 'text-gray-900'
                }
              >
                {PRIORITY_LABELS[order.priority]}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
                Fecha estimada
              </dt>
              <dd className="text-gray-900">{formatDate(order.estimatedCompletionDate)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Creada</dt>
              <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
                Última actualización
              </dt>
              <dd className="text-gray-900">{formatDate(order.updatedAt)}</dd>
            </div>
            {order.observations && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
                  Observaciones
                </dt>
                <dd className="text-gray-700">{order.observations}</dd>
              </div>
            )}
            {order.diagnosis && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">
                  Diagnóstico / Justificación clínica
                </dt>
                <dd className="text-gray-700">{order.diagnosis}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Consent */}
        <ConsentPanel orderId={order.id} />

        {/* Tests */}
        <Card padding="lg">
          <CardHeader title="Exámenes solicitados" />
          <div className="mt-4 space-y-2">
            {(order.tests ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">Sin exámenes agregados.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {(order.tests ?? []).map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-2 text-sm text-gray-700"
                  >
                    <span>{t.name}</span>
                    <button
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Eliminar examen"
                      onClick={() => setDeleteTestId(t.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add test */}
            <form onSubmit={handleAddTest} className="flex gap-2 mt-3">
              <input
                type="text"
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
                placeholder="Nombre del examen…"
                className="flex-1 text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                loading={addTestMutation.isPending}
                disabled={!newTestName.trim()}
              >
                <Plus size={14} className="mr-1" />
                Agregar
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Status confirm */}
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) {
            statusMutation.mutate(pendingStatus, {
              onSuccess: () => setPendingStatus(null),
            });
          }
        }}
        variant="primary"
        title="Confirmar cambio de estado"
        message={
          pendingStatus
            ? `¿Cambiar el estado a "${ORDER_STATUS_LABELS[pendingStatus]}"?`
            : ''
        }
        confirmLabel="Confirmar"
        loading={statusMutation.isPending}
      />

      {/* Delete test confirm */}
      <ConfirmDialog
        open={Boolean(deleteTestId)}
        onClose={() => setDeleteTestId(null)}
        onConfirm={() => {
          if (deleteTestId) {
            deleteTestMutation.mutate(deleteTestId, {
              onSuccess: () => setDeleteTestId(null),
            });
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
