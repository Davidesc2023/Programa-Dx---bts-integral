import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadCount,
  markRead as markReadApi,
  markAllRead as markAllReadApi,
  type Notification,
} from '@/services/notifications.service';

const NOTIFICATIONS_KEY = ['notifications'] as const;
const UNREAD_COUNT_KEY = ['notifications', 'unreadCount'] as const;

export function useNotifications(page = 1, limit = 20) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, page, limit],
    queryFn: () => getNotifications(page, limit),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const unreadCountQuery = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: getUnreadCount,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markReadApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });

  return {
    notifications: (notificationsQuery.data?.data ?? []) as Notification[],
    meta: notificationsQuery.data?.meta,
    unreadCount: unreadCountQuery.data?.unreadCount ?? 0,
    isLoading: notificationsQuery.isLoading,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    refetch: () => {
      void notificationsQuery.refetch();
      void unreadCountQuery.refetch();
    },
  };
}
