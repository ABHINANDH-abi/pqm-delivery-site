import { Router } from 'express';
import { productsController } from './products.controller';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './products.validation';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);

// Admin-only routes
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  validate(createProductSchema),
  productsController.create
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  validate(updateProductSchema),
  productsController.update
);

router.patch(
  '/:id/toggle-availability',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  productsController.toggleAvailability
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  productsController.delete
);

export default router;
