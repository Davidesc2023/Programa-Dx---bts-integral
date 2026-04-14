'use client';

import { useQueries } from '@tanstack/react-query';
import { getPatients } from '@/services/patients.service';
import { getOrders } from '@/services/orders.service';
import { OrderStatus } from '@/types/enums';
import type { Order } from '@/types/api.types';

export interface DashboardStats {
  totalPatients: number;
  pendingOrders: number;
  activeOrders: number;
  completedOrders: number;
  recentOrders: Order[];
  isLoading: boolean;
  isError: boolean;
}

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.ACCEPTED,
  OrderStatus.SCHEDULED,
  OrderStatus.MUESTRA_RECOLECTADA,
  OrderStatus.EN_ANALISIS,
];

export function useDashboard(): DashboardStats {
  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'patients-count'],
        queryFn: () => getPatients({ page: 1, limit: 1 }),
        staleTime: 60_000,
      },
      {
        queryKey: ['dashboard', 'pending-orders'],
        queryFn: () => getOrders({ page: 1, limit: 1, status: OrderStatus.PENDIENTE }),
        staleTime: 30_000,
      },
      {
        queryKey: ['dashboard', 'completed-orders'],
        queryFn: () => getOrders({ page: 1, limit: 1, status: OrderStatus.COMPLETADA }),
        staleTime: 60_000,
      },
      {
        queryKey: ['dashboard', 'recent-orders'],
        queryFn: () => getOrders({ page: 1, limit: 10 }),
        staleTime: 30_000,
      },
    ],
  });

  const [patientsQ, pendingQ, completedQ, recentQ] = results;

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  // Count active orders from the recent list (avoid extra requests)
  const recentOrders = recentQ.data?.data ?? [];
  const activeOrders = recentOrders.filter((o) =>
    ACTIVE_STATUSES.includes(o.status),
  ).length;

  return {
    totalPatients: patientsQ.data?.meta.total ?? 0,
    pendingOrders: pendingQ.data?.meta.total ?? 0,
    activeOrders,
    completedOrders: completedQ.data?.meta.total ?? 0,
    recentOrders,
    isLoading,
    isError,
  };
}
