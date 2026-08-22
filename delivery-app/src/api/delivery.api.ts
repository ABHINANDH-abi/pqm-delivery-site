import { apiClient } from './client';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productName: string;
  unitPrice: string | number;
  quantity: number;
  totalPrice: string | number;
}

export interface DeliveryOrder {
  id: string;
  status: OrderStatus;
  subtotal: string | number;
  deliveryFee: string | number;
  totalAmount: string | number;
  deliveryAddressText: string;
  notes?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: OrderItem[];
  payment?: {
    method: string;
    status: string;
    amount: string | number;
  };
  createdAt: string;
}

export const deliveryApi = {
  getAssignedOrders: async (): Promise<DeliveryOrder[]> => {
    const res = await apiClient.get('/delivery/orders/assigned');
    return res.data.data;
  },

  getAvailableOrders: async (): Promise<DeliveryOrder[]> => {
    const res = await apiClient.get('/delivery/orders/available');
    return res.data.data;
  },

  assignOrder: async (orderId: string): Promise<DeliveryOrder> => {
    const res = await apiClient.post(`/delivery/orders/${orderId}/assign`);
    return res.data.data;
  },

  updateStatus: async (orderId: string, status: OrderStatus): Promise<DeliveryOrder> => {
    const res = await apiClient.patch(`/delivery/orders/${orderId}/status`, { status });
    return res.data.data;
  },

  updateLocation: async (latitude: number, longitude: number, isOnline = true): Promise<void> => {
    await apiClient.patch('/delivery/location', { latitude, longitude, isOnline });
  },
};
