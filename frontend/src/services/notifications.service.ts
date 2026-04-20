import { api } from './api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getNotifications(
  page = 1,
  limit = 20,
): Promise<NotificationsResponse> {
  const { data } = await api.get('/notifications', { params: { page, limit } });
  return data.data as NotificationsResponse;
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  const { data } = await api.get('/notifications/unread-count');
  return data.data as { unreadCount: number };
}

export async function markRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
