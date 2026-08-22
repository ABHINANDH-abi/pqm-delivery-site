import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { validate } from '../../middleware/validate';
import { registerFcmTokenSchema } from './notifications.validation';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/fcm-token', validate(registerFcmTokenSchema), notificationsController.registerFcmToken);
router.get('/', notificationsController.getMyNotifications);
router.patch('/:id/read', notificationsController.markAsRead);

export default router;
