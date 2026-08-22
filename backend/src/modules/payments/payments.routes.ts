import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { validate } from '../../middleware/validate';
import { createPaymentOrderSchema, verifyPaymentSchema } from './payments.validation';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public webhook endpoint for Razorpay servers
router.post('/webhook', paymentsController.webhook);

// Customer endpoints require authentication
router.use(authenticate);
router.post('/create-order', validate(createPaymentOrderSchema), paymentsController.createRazorpayOrder);
router.post('/verify', validate(verifyPaymentSchema), paymentsController.verifyPayment);

export default router;
