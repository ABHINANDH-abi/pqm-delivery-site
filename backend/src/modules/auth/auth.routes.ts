import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post('/send-otp', AuthController.sendOtp);
router.get('/diagnose-email', AuthController.diagnoseEmail);
router.post('/verify-otp-and-register', AuthController.verifyOtpAndRegister);
router.post('/register', validate(registerSchema, 'body'), AuthController.register);
router.post('/login', validate(loginSchema, 'body'), AuthController.login);
router.post('/login-with-otp', AuthController.loginWithOtp);

router.post('/refresh-token', validate(refreshTokenSchema, 'body'), AuthController.refreshToken);
router.get('/me', authenticate, AuthController.me);

export default router;
