import { Router } from 'express';
import { deliveryController } from './delivery.controller';
import { validate } from '../../middleware/validate';
import {
  assignOrderSchema,
  updateDeliveryStatusSchema,
  updateLocationSchema,
} from './delivery.validation';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All delivery routes require authentication and DELIVERY_PARTNER or ADMIN role
router.use(authenticate);

router.get(
  '/orders/assigned',
  authorizeRoles(UserRole.DELIVERY_PARTNER, UserRole.ADMIN),
  deliveryController.getAssignedOrders
);

router.get(
  '/orders/available',
  authorizeRoles(UserRole.DELIVERY_PARTNER, UserRole.ADMIN),
  deliveryController.getAvailableOrders
);

router.post(
  '/orders/:id/assign',
  authorizeRoles(UserRole.DELIVERY_PARTNER, UserRole.ADMIN),
  validate(assignOrderSchema),
  deliveryController.assignOrder
);

router.patch(
  '/orders/:id/status',
  authorizeRoles(UserRole.DELIVERY_PARTNER, UserRole.ADMIN),
  validate(updateDeliveryStatusSchema),
  deliveryController.updateStatus
);

router.patch(
  '/location',
  authorizeRoles(UserRole.DELIVERY_PARTNER),
  validate(updateLocationSchema),
  deliveryController.updateLocation
);

export default router;
