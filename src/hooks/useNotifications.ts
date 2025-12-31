// src/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../utils/queryClient';
import { listMyNotifications, NotificationItem } from '../services/notifications';
import api from '../services/api';

/**
 * Hook: Fetch user notifications with caching
 * @param options - Query options (limit, offset)
 * @param enabled - Whether to run the query (default: true)
 */
export function useNotifications(
  options?: { limit?: number; offset?: number },
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...queryKeys.notifications.lists(), options],
    queryFn: async () => {
      const data = await listMyNotifications(options || {});
      return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    },
    enabled,

    // ✅ Always show latest when screen mounts
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnReconnect: true,

    // ✅ Optional: auto-refresh for near real-time
    refetchInterval: 15000, // every 15s (tune to 10–30s)
    gcTime: 5 * 60 * 1000,
  });
}


/**
 * Hook: Get unread notifications count
 * @param enabled - Whether to run the query (default: true)
 */
export function useUnreadNotificationsCount(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      const data = await listMyNotifications({ limit: 50, offset: 0 });
      const notifications = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.items) 
        ? data.items 
        : [];
      return notifications.filter((n: NotificationItem) => !n.is_read).length;
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute (very time-sensitive)
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });
}

/**
 * Hook: Mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      // Invalidate all notification queries
      invalidateQueries.notifications();
    },
  });
}

/**
 * Hook: Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      // Invalidate all notification queries
      invalidateQueries.notifications();
    },
  });
}

/**
 * Hook: Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onMutate: async (notificationId) => {
      // Optimistically remove notification from cache
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const previousNotifications = queryClient.getQueryData<NotificationItem[]>(
        queryKeys.notifications.lists()
      );

      if (previousNotifications) {
        queryClient.setQueryData<NotificationItem[]>(
          queryKeys.notifications.lists(),
          previousNotifications.filter((n) => n.id !== notificationId)
        );
      }

      return { previousNotifications };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.lists(), context.previousNotifications);
      }
    },
    onSettled: () => {
      invalidateQueries.notifications();
    },
  });
}