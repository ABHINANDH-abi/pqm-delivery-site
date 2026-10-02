import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.validation';
import { emailService } from '../../services/email.service';

export class AuthController {
  static async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, phone } = req.body;
      const result = await AuthService.sendOtp(email, name, phone);
      sendSuccess(res, result, {
        statusCode: 200,
        message: '6-Digit Verification OTP sent to your Gmail',
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtpAndRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.verifyOtpAndRegister(req.body);
      sendSuccess(res, result, {
        statusCode: 201,
        message: 'Email verified and registration successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const result = await AuthService.register(input);
      sendSuccess(res, result, {
        statusCode: 201,
        message: 'Registration successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const result = await AuthService.login(input);
      sendSuccess(res, result, {
        statusCode: 200,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async loginWithOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.loginWithOtp(email, otp);
      sendSuccess(res, result, {
        statusCode: 200,
        message: 'OTP Login successful',
      });
    } catch (error) {
      next(error);
    }
  }


  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const result = await AuthService.refreshAccessToken(refreshToken);
      sendSuccess(res, result, {
        statusCode: 200,
        message: 'Access token refreshed',
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getUserProfile(userId);
      sendSuccess(res, { user }, {
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  }

  static async diagnoseEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const to = (req.query['to'] as string) || '6abhi6nad6@gmail.com';
      const result = await emailService.testConnectionAndSend(to);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
