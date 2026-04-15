'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrderStatus } from '@/services/orders.service';
import { getAllowedTransitions } from '@/modules/orders/orderTransitions';
import { useAuthStore } from '@/modules/auth/authStore';
import { ORDER_STATUS_LABELS, OrderStatus, UserRole } from '@/types/enums';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';

const IN_PROGRESS_STATUSES = [
  OrderStatus.ACCEPTED,
  OrderStatus.SCHEDULED,
  OrderStatus.MUESTRA_RECOLECTADA,
  OrderStatus.EN_ANALISIS,
];

const ROLES_WITH_ACTIONS: UserRole[] = [
  UserRole.ADMIN,
  UserRole.OPERADOR,
  UserRole.LABORATORIO,
];

export function OrdersInProgress() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [advancing, setAdvancing] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders-in-progress'],
    queryFn: () => getOrders({ page: 1, limit: 20 }),
    staleTime: 20_000,
    select: (res) =>
      res.data.filter((o) => IN_PROGRESS_STATUSES.includes(o.status)),
  });

  const orders = data ?? [];
  const canAct = user?.role
    ? ROLES_WITH_ACTIONS.includes(user.role as UserRole)
    : false;

  async function handleAdvance(orderId: string, newStatus: OrderStatus) {
    setAdvancing(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      await qc.invalidateQueries({ queryKey: ['orders-in-progress'] });
      await qc.invalidateQueries({ queryKey: ['orders'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Orden avanzada a ${ORDER_STATUS_LABELS[newStatus]}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setAdvancing(null);
    }
  }

  return (
    <Card padding="none">
      <CardHeader
        title="Órdenes en proceso"
        description="Órdenes activas que requieren acción"
        action={
          <Link
            href="/orders"
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todas <ArrowRight size={14} />
          </Link>
        }
      />

      {isLoading ? (
        <div className="p-4">
          <TableSkeleton rows={4} cols={3} />
        </div>
      ) : orders.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-gray-400">
          No hay órdenes activas en este momento.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Estado
                </th>
                {canAct && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Acción
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => {
                const transitions = user?.role
                  ? getAllowedTransitions(user.role as UserRole, order.status)
                  : [];
                const isAdvancing = advancing === order.id;

                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-800">
                      {order.patient
                        ? `${order.patient.firstName} ${order.patient.lastName}`
                        : <span className="text-gray-400 italic">Sin paciente</span>}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    {canAct && (
                      <td className="px-6 py-3">
                        {transitions.length > 0 ? (
                          <select
                            disabled={isAdvancing}
                            className="text-xs rounded-md border border-gray-300 px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            defaultValue=""
                            onChange={(e) => {
                              const val = e.target.value as OrderStatus;
                              if (val) handleAdvance(order.id, val);
                              e.target.value = '';
                            }}
                          >
                            <option value="" disabled>
                              {isAdvancing ? 'Avanzando…' : 'Avanzar a…'}
                            </option>
                            {transitions.map((s) => (
                              <option key={s} value={s}>
                                {ORDER_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium text-xs"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
