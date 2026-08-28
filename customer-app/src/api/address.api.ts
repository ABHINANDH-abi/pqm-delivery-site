import { apiClient } from './client';

export interface Address {
  id: string;
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

export const addressApi = {
  getMyAddresses: async (): Promise<Address[]> => {
    const res = await apiClient.get('/addresses');
    return res.data.data;
  },

  create: async (data: CreateAddressPayload): Promise<Address> => {
    const res = await apiClient.post('/addresses', data);
    return res.data.data;
  },

  setDefault: async (id: string): Promise<Address> => {
    const res = await apiClient.patch(`/addresses/${id}/default`);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },
};
