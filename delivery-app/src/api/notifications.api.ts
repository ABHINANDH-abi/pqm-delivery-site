import { apiClient } from './client';

export interface AppNotification {
  id: string;
  userId: string;
  orderId?: string | null;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getMyNotifications: async (): Promise<AppNotification[]> => {
    const res = await apiClient.get('/notifications');
    return res.data.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },
};
