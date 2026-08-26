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
  productId: string;
  productName: string;
  unitPrice: string | number;
  quantity: number;
  totalPrice: string | number;
  product?: {
    imageUrl?: string;
    isVeg?: boolean;
  };
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: string | number;
  deliveryFee: string | number;
  totalAmount: string | number;
  deliveryAddressText: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  customerId: string;
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

export interface CreateOrderPayload {
  addressId: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: 'CASH_ON_DELIVERY' | 'RAZORPAY';
  customerNotes?: string;
}

export const ordersApi = {
  create: async (data: CreateOrderPayload): Promise<Order> => {
    const res = await apiClient.post('/orders', data);
    return res.data.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get('/orders');
    return res.data.data;
  },

  getById: async (id: string): Promise<Order> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data.data;
  },

  cancel: async (id: string, reason?: string): Promise<Order> => {
    const res = await apiClient.post(`/orders/${id}/cancel`, { reason });
    return res.data.data;
  },

  rateOrder: async (id: string, rating: number, feedback?: string): Promise<Order> => {
    const res = await apiClient.post(`/orders/${id}/rating`, { rating, feedback });
    return res.data.data;
  },
};
