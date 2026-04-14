'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  addOrderTest,
  deleteOrderTest,
} from '@/services/orders.service';
import { getApiErrorMessage } from '@/services/api';
import type { OrderFormValues } from '@/lib/validators';
import type { OrderStatus } from '@/types/enums';

const ORDERS_KEY = 'orders';
const PAGE_SIZE = 15;

// ─── List ─────────────────────────────────────────────────────────────────────

export function useOrderList(defaultStatus?: OrderStatus) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | undefined>(defaultStatus);

  const query = useQuery({
    queryKey: [ORDERS_KEY, { page, status }],
    queryFn: () => getOrders({ page, limit: PAGE_SIZE, status }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return {
    ...query,
    page,
    setPage,
    status,
    setStatus,
    orders: query.data?.data ?? [],
    total: query.data?.meta.total ?? 0,
    totalPages: query.data?.meta.totalPages ?? 1,
  };
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useOrder(id: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => getOrderById(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateOrder(onSuccess?: (id: string) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderFormValues) => createOrder(payload),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      toast.success('Orden creada correctamente');
      onSuccess?.(order.id);
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateOrder(id: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<OrderFormValues>) => updateOrder(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      toast.success('Orden actualizada');
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}

// ─── Status transition ────────────────────────────────────────────────────────

export function useUpdateOrderStatus(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nextStatus: OrderStatus) => updateOrderStatus(orderId, nextStatus),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      toast.success(`Estado actualizado a "${order.status}"`);
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteOrder(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] });
      toast.success('Orden eliminada');
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

export function useAddOrderTest(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => addOrderTest(orderId, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY, orderId] });
      toast.success('Examen agregado');
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDeleteOrderTest(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) => deleteOrderTest(orderId, testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ORDERS_KEY, orderId] });
      toast.success('Examen eliminado');
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });
}
