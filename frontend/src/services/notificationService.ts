import { api } from './api';
import { NotificationItem } from '../types';

export const notificationService = {
  async listNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const res = await api.get('/notifications');
    return res.data.data;
  },

  async markAsRead(id: string = 'all'): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },
};
