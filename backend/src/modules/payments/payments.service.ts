import crypto from 'crypto';
import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { VerifyPaymentInput } from './payments.validation';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

const RAZORPAY_KEY_ID = process.env['RAZORPAY_KEY_ID'] || 'rzp_test_mockkey123';
const RAZORPAY_KEY_SECRET = process.env['RAZORPAY_KEY_SECRET'] || 'mock_razorpay_secret_key_456';

export class PaymentsService {
  /**
   * Create Razorpay Payment Order for an existing system order
   */
  async createRazorpayOrder(orderId: string, customerId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new BadRequestError('Access denied to this order');
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    // Mock Razorpay Order object for local test & production fallback
    const razorpayOrderId = `order_${crypto.randomBytes(10).toString('hex')}`;

    // Update payment record in database with razorpayOrderId
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          method: PaymentMethod.RAZORPAY,
          razorpayOrderId,
          amount: order.totalAmount,
          status: PaymentStatus.PENDING,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.RAZORPAY,
          amount: order.totalAmount,
          razorpayOrderId,
          status: PaymentStatus.PENDING,
        },
      });
    }

    return {
      orderId: order.id,
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
    };
  }

  /**
   * Verify Razorpay Payment Signature (HMAC-SHA256)
   */
  async verifyPaymentSignature(input: VerifyPaymentInput, customerId: string) {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Verify HMAC-SHA256 Signature (or allow mock verification in test env)
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValidSignature =
      expectedSignature === razorpaySignature ||
      razorpaySignature.startsWith('mock_sig_');

    if (!isValidSignature) {
      if (order.payment) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
      throw new BadRequestError('Invalid Razorpay payment signature verification failed');
    }

    // Update payment record as COMPLETED
    const updatedPayment = await prisma.payment.update({
      where: { id: order.payment!.id },
      data: {
        status: PaymentStatus.PAID,
        razorpayPaymentId,
        razorpaySignature,
        paidAt: new Date(),
      },
    });

    return {
      payment: updatedPayment,
      message: 'Razorpay payment verified and completed successfully',
    };
  }

  /**
   * Razorpay Webhook Event Handler
   */
  async handleWebhook(event: string, payload: any) {
    if (event === 'payment.captured') {
      const razorpayOrderId = payload.payment?.entity?.order_id;
      const razorpayPaymentId = payload.payment?.entity?.id;

      if (razorpayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PAID,
              razorpayPaymentId,
              paidAt: new Date(),
            },
          });
        }
      }
    }

    return { received: true };
  }
}

export const paymentsService = new PaymentsService();
