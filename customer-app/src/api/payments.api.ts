import { apiClient } from './client';

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const paymentsApi = {
  createRazorpayOrder: async (orderId: string): Promise<RazorpayOrderResponse> => {
    const res = await apiClient.post('/payments/create-order', { orderId });
    return res.data.data;
  },

  verifyPayment: async (payload: VerifyPaymentPayload): Promise<void> => {
    await apiClient.post('/payments/verify', payload);
  },
};
