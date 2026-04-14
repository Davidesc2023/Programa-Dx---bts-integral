'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardPlus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useOrderList, useDeleteOrder } from './useOrders';
import { ORDER_STATUS_LABELS, PRIORITY_LABELS, OrderStatus } from '@/types/enums';

const STATUS_FILTER_OPTIONS: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: OrderStatus.PENDIENTE, label: ORDER_STATUS_LABELS[OrderStatus.PENDIENTE] },
  { value: OrderStatus.CONSENT_PENDING, label: ORDER_STATUS_LABELS[OrderStatus.CONSENT_PENDING] },
  { value: OrderStatus.ACCEPTED, label: ORDER_STATUS_LABELS[OrderStatus.ACCEPTED] },
  { value: OrderStatus.SCHEDULED, label: ORDER_STATUS_LABELS[OrderStatus.SCHEDULED] },
  { value: OrderStatus.MUESTRA_RECOLECTADA, label: ORDER_STATUS_LABELS[OrderStatus.MUESTRA_RECOLECTADA] },
  { value: OrderStatus.EN_ANALISIS, label: ORDER_STATUS_LABELS[OrderStatus.EN_ANALISIS] },
  { value: OrderStatus.COMPLETADA, label: ORDER_STATUS_LABELS[OrderStatus.COMPLETADA] },
  { value: OrderStatus.CANCELADA, label: ORDER_STATUS_LABELS[OrderStatus.CANCELADA] },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function OrderList() {
  const { orders, isLoading, isError, page, setPage, totalPages, total, status, setStatus } =
    useOrderList();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteOrder(() => setDeleteId(null));

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <select
            value={status ?? ''}
            onChange={(e) => {
              setStatus((e.target.value as OrderStatus) || undefined);
              setPage(1);
            }}
            className="text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white max-w-xs"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Link href="/orders/new">
            <Button variant="primary" size="sm">
              <ClipboardPlus size={15} className="mr-1.5" />
              Nueva orden
            </Button>
          </Link>
        </div>

        <Card padding="none">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={5} />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500 px-6 py-8 text-center">Error al cargar las órdenes.</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400 px-6 py-10 text-center">No hay órdenes que mostrar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['ID', 'Paciente', 'Médico', 'Prioridad', 'Estado', 'Fecha', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((o) => {
                    const patientName = o.patient
                      ? `${o.patient.firstName} ${o.patient.lastName}`
                      : o.patientId.slice(0, 8) + '…';
                    return (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <Link
                            href={`/orders/${o.id}`}
                            className="font-mono text-xs text-primary-600 hover:underline"
                          >
                            {o.id.slice(0, 8)}…
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-gray-700 max-w-[140px] truncate">
                          {patientName}
                        </td>
                        <td className="px-5 py-3 text-gray-600 max-w-[140px] truncate">
                          {o.physician ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              o.priority === 'URGENTE'
                                ? 'text-red-600 font-semibold text-xs'
                                : 'text-gray-500 text-xs'
                            }
                          >
                            {PRIORITY_LABELS[o.priority]}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(o.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                            onClick={() => setDeleteId(o.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                {total} orden{total !== 1 ? 'es' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Eliminar orden"
        message="Se eliminará esta orden y todos sus datos asociados. ¿Deseas continuar?"
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
