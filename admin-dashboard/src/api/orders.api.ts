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
  | 'CANCELLED'
  | 'REJECTED';

export interface OrderItem {
  id: string;
  productName: string;
  unitPrice: string | number;
  quantity: number;
  totalPrice: string | number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: string | number;
  deliveryFee: string | number;
  totalAmount: string | number;
  deliveryAddressText: string;
  notes?: string;
  customerId: string;
  customer: {
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
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const ordersApi = {
  getAll: async (status?: OrderStatus): Promise<Order[]> => {
    const res = await apiClient.get('/orders', { params: { status } });
    return res.data.data;
  },

  getById: async (id: string): Promise<Order> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data.data;
  },

  updateStatus: async (id: string, status: OrderStatus, cancellationReason?: string): Promise<Order> => {
    const res = await apiClient.patch(`/orders/${id}/status`, {
      status,
      cancellationReason,
    });
    return res.data.data;
  },
};
