import api from './api';

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
};

export async function listMyNotifications(params?: { limit?: number; offset?: number }) {
  const res = await api.get('/notifications', { params });
  // expect: { items: NotificationItem[], unreadCount?: number } OR NotificationItem[]
  return res.data;
}

export async function markNotificationRead(id: string) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.patch(`/notifications/read-all`);
  return res.data;
}
