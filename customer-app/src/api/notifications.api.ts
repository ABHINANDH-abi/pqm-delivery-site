import { apiClient } from './client';

export interface NotificationItem {
  id: string;
  orderId?: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  registerFcmToken: async (fcmToken: string): Promise<void> => {
    await apiClient.post('/notifications/fcm-token', {
      fcmToken,
      deviceType: 'ANDROID',
    });
  },

  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get('/notifications');
    return res.data.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },
};
