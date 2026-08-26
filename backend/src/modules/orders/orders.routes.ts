import { Router } from 'express';
import { ordersController } from './orders.controller';
import { validate } from '../../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from './orders.validation';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All order routes require authentication
router.use(authenticate);

router.post('/', validate(createOrderSchema), ordersController.create);
router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getById);

// Admin & Delivery Partner status transition endpoint
router.patch(
  '/:id/status',
  authorizeRoles(UserRole.ADMIN, UserRole.DELIVERY_PARTNER),
  validate(updateOrderStatusSchema),
  ordersController.updateStatus
);

// Customer order cancellation
router.post('/:id/cancel', ordersController.cancel);

// Customer order rating & feedback
router.post('/:id/rating', ordersController.rate);

export default router;
