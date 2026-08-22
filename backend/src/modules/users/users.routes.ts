import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/me', authenticate, UsersController.getMe);

export default router;
