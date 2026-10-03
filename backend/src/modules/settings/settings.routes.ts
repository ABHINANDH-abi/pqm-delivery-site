import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public route — customer apps, web portals & admins can read store settings & UPI ID
router.get('/', settingsController.getSettings);

// Admin-only route — only authorized admin can update restaurant settings & UPI ID
router.patch(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  settingsController.updateSettings
);

router.put(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  settingsController.updateSettings
);

export default router;
