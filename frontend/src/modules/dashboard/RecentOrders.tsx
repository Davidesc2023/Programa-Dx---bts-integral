'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { PRIORITY_LABELS } from '@/types/enums';
import type { Order } from '@/types/api.types';

interface RecentOrdersProps {
  orders: Order[];
  isLoading: boolean;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  return (
    <Card padding="none">
      <CardHeader
        title="Órdenes recientes"
        description="Últimas 10 órdenes ingresadas al sistema"
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
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : orders.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-gray-400">
          No hay órdenes registradas aún.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Médico
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-mono text-xs text-primary-600 hover:underline"
                    >
                      {order.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-700 max-w-[160px] truncate">
                    {order.physician ?? '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={
                        order.priority === 'URGENTE'
                          ? 'text-red-600 font-semibold text-xs'
                          : 'text-gray-500 text-xs'
                      }
                    >
                      {PRIORITY_LABELS[order.priority]}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
