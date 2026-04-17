'use client';

import Link from 'next/link';
import { ArrowRight, Eye } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ORDER_STATUS_LABELS, OrderStatus, PRIORITY_LABELS } from '@/types/enums';
import type { Order } from '@/types/api.types';

const STATUS_PILL: Record<OrderStatus, { bg: string; text: string }> = {
  [OrderStatus.PENDIENTE]:           { bg: 'rgba(208,166,0,0.10)',  text: '#584400' },
  [OrderStatus.CONSENT_PENDING]:     { bg: 'rgba(0,97,163,0.10)',   text: '#004474' },
  [OrderStatus.ACCEPTED]:            { bg: 'rgba(27,122,107,0.10)', text: '#006053' },
  [OrderStatus.SCHEDULED]:           { bg: 'rgba(0,97,163,0.10)',   text: '#004474' },
  [OrderStatus.RECHAZADA]:           { bg: 'rgba(186,26,26,0.10)',  text: '#ba1a1a' },
  [OrderStatus.MUESTRA_RECOLECTADA]: { bg: 'rgba(27,122,107,0.10)', text: '#006053' },
  [OrderStatus.EN_ANALISIS]:         { bg: 'rgba(0,97,163,0.10)',   text: '#004474' },
  [OrderStatus.COMPLETADA]:          { bg: 'rgba(27,122,107,0.10)', text: '#006053' },
  [OrderStatus.CANCELADA]:           { bg: 'rgba(110,121,118,0.10)','text': '#3e4946' },
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function getInitials(order: Order): string {
  if (order.doctor?.firstName || order.doctor?.lastName) {
    const f = order.doctor.firstName?.[0] ?? '';
    const l = order.doctor.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
  }
  return order.id.slice(0, 2).toUpperCase();
}

function getDoctorName(order: Order): string {
  if (order.doctor?.firstName || order.doctor?.lastName) {
    return [order.doctor.firstName, order.doctor.lastName].filter(Boolean).join(' ');
  }
  return order.physician ?? '—';
}

interface RecentOrdersProps {
  orders: Order[];
  isLoading: boolean;
}

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2
            className="text-2xl font-extrabold tracking-tight text-on-surface"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Órdenes Recientes
          </h2>
          <p className="text-on-surface-variant text-sm font-medium mt-0.5">
            Gestión de diagnósticos y seguimiento de pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/orders"
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border transition-colors"
            style={{ borderColor: 'rgba(27,122,107,0.20)', color: '#006053' }}
          >
            Ver Todo <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0px 8px 24px rgba(25,28,29,0.06)' }}
      >
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : orders.length === 0 ? (
          <div className="px-8 py-12 text-center text-sm text-outline">
            No hay órdenes registradas aún.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr style={{ background: 'rgba(242,244,244,0.50)' }}>
                {['Médico / Orden', 'Prioridad', 'Estado', 'Fecha', ''].map((h) => (
                  <th
                    key={h}
                    className="px-8 py-5 text-xs font-black uppercase tracking-wider"
                    style={{ color: '#3e4946' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const pill = STATUS_PILL[order.status] ?? STATUS_PILL[OrderStatus.PENDIENTE];
                const initials = getInitials(order);
                const doctorName = getDoctorName(order);
                return (
                  <tr
                    key={order.id}
                    className="group border-t transition-colors"
                    style={{ borderColor: '#f2f4f4' }}
                  >
                    {/* Doctor + ID */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ background: '#f2f4f4', color: '#1B7A6B' }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p
                            className="text-sm font-bold text-on-surface"
                            style={{ fontFamily: 'Manrope, sans-serif' }}
                          >
                            {doctorName}
                          </p>
                          <p className="text-[10px] text-outline font-medium font-mono">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Prioridad */}
                    <td className="px-8 py-5">
                      <span
                        className="text-xs font-bold"
                        style={{ color: order.priority === 'URGENTE' ? '#ba1a1a' : '#3e4946' }}
                      >
                        {PRIORITY_LABELS[order.priority]}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-8 py-5">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wide uppercase"
                        style={{ background: pill.bg, color: pill.text }}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>

                    {/* Fecha */}
                    <td
                      className="px-8 py-5 text-sm whitespace-nowrap"
                      style={{ color: '#3e4946' }}
                    >
                      {formatDate(order.createdAt)}
                    </td>

                    {/* Acciones */}
                    <td className="px-8 py-5 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center justify-center p-2 rounded-full transition-all"
                        style={{ color: '#6e7976' }}
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}


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
                    {order.doctor?.firstName || order.doctor?.lastName
                      ? [order.doctor.firstName, order.doctor.lastName].filter(Boolean).join(' ')
                      : (order.physician ?? '—')}
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
