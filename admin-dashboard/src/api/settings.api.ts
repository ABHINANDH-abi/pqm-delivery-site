import { apiClient } from './client';

export interface RestaurantSettings {
  id?: string;
  restaurantName: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  taxRatePercent: number;
  flatDeliveryFee: number;
  isAcceptingOrders: boolean;
  merchantUpiId: string;
  payeeName: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}

export const settingsApi = {
  getSettings: async (): Promise<RestaurantSettings> => {
    const res = await apiClient.get('/settings');
    return res.data.data;
  },

  updateSettings: async (data: Partial<RestaurantSettings>): Promise<RestaurantSettings> => {
    const res = await apiClient.patch('/settings', data);
    return res.data.data;
  },
};
