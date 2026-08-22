import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { validate } from '../../middleware/validate';
import { createCategorySchema, updateCategorySchema } from './categories.validation';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', categoriesController.getAll);
router.get('/:id', categoriesController.getById);

// Admin-only routes
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  validate(createCategorySchema),
  categoriesController.create
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  validate(updateCategorySchema),
  categoriesController.update
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  categoriesController.delete
);

export default router;
