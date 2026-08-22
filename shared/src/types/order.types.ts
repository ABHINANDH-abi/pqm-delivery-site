import { OrderStatus } from '../constants/order-status';

export interface OrderItemSnapshot {
  productId: string;
  productName: string;   // snapshot — name at time of order
  unitPrice: number;     // snapshot — price at time of order
  quantity: number;
  totalPrice: number;
}

export interface OrderPublic {
  id: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  notes: string | null;
  customerId: string;
  deliveryPartnerId: string | null;
  createdAt: string;
  updatedAt: string;
}
