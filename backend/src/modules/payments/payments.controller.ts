import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess } from '../../utils/response';

export class PaymentsController {
  async createRazorpayOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.userId;
      const { orderId } = req.body;
      const data = await paymentsService.createRazorpayOrder(orderId, customerId);
      return sendSuccess(res, data, 'Razorpay payment order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.userId;
      const data = await paymentsService.verifyPaymentSignature(req.body, customerId);
      return sendSuccess(res, data, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const event = req.body.event;
      const payload = req.body.payload;
      const result = await paymentsService.handleWebhook(event, payload);
      return sendSuccess(res, result, 'Webhook processed');
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
