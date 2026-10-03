import { apiClient } from './client';

export interface RestaurantSettings {
  restaurantName: string;
  merchantUpiId: string;
  payeeName: string;
  phone?: string;
  taxRatePercent?: number;
  flatDeliveryFee?: number;
}

export const settingsApi = {
  getSettings: async (): Promise<RestaurantSettings> => {
    const res = await apiClient.get('/settings');
    return res.data.data;
  },
};
