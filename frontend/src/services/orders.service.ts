import { api as apiClient } from './api';
import type { PaginatedApiResponse, ApiResponse, Order, OrderTest } from '@/types/api.types';
import type { OrderStatus, Priority } from '@/types/enums';
import type { OrderFormValues } from '@/lib/validators';

export interface OrderQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  patientId?: string;
  priority?: Priority;
}

export async function getOrders(
  query: OrderQuery = {},
): Promise<PaginatedApiResponse<Order>> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.patientId) params.set('patientId', query.patientId);
  if (query.priority) params.set('priority', query.priority);

  const { data } = await apiClient.get<PaginatedApiResponse<Order>>(
    `/orders?${params.toString()}`,
  );
  return data;
}

export async function getOrderById(id: string): Promise<Order> {
  const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
  return data.data;
}

export async function createOrder(payload: OrderFormValues): Promise<Order> {
  const { data } = await apiClient.post<ApiResponse<Order>>('/orders', payload);
  return data.data;
}

export async function updateOrder(id: string, payload: Partial<OrderFormValues>): Promise<Order> {
  const { data } = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}`, payload);
  return data.data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data } = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
  return data.data;
}

export async function deleteOrder(id: string): Promise<void> {
  await apiClient.delete(`/orders/${id}`);
}

// ─── Order tests ──────────────────────────────────────────────────────────────

export async function addOrderTest(orderId: string, name: string): Promise<OrderTest> {
  const { data } = await apiClient.post<ApiResponse<OrderTest>>(
    `/orders/${orderId}/tests`,
    { name },
  );
  return data.data;
}

export async function deleteOrderTest(orderId: string, testId: string): Promise<void> {
  await apiClient.delete(`/orders/${orderId}/tests/${testId}`);
}
