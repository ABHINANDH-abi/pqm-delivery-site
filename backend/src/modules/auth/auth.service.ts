import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import { RegisterInput, LoginInput } from './auth.validation';
import { UserRole } from '../../../../shared/src/constants/roles';
import { UserPublic } from '../../../../shared/src/types/user.types';
import { emailService } from '../../services/email.service';

export interface AuthResult {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

function formatUserResponse(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

export class AuthService {
  static async sendOtp(email: string, name?: string, phone?: string): Promise<{ message: string; email: string }> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.includes('@')) {
      throw new BadRequestError('Please provide a valid email address');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[cleanEmail] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    console.log(`\n======================================================`);
    console.log(`✉️ REAL GMAIL OTP VERIFICATION FOR ${cleanEmail.toUpperCase()}:`);
    console.log(`🔑 OTP CODE: [ ${otp} ]`);
    console.log(`======================================================\n`);

    // Dispatch real email via Nodemailer SMTP
    await emailService.sendOtpEmail(cleanEmail, otp, name);

    return {
      message: `6-Digit Verification OTP sent to ${cleanEmail}`,
      email: cleanEmail,
    };
  }

  static async verifyOtpAndRegister(input: RegisterInput & {
    otp: string;
    addressLine1?: string;
    city?: string;
    pincode?: string;
  }): Promise<AuthResult> {
    const cleanEmail = input.email.toLowerCase().trim();
    const record = otpStore[cleanEmail];

    // Allow dev bypass code 123456 or exact match
    if (!record && input.otp !== '123456') {
      throw new BadRequestError('OTP expired or not requested. Please tap Resend OTP.');
    }

    if (record && record.otp !== input.otp.trim() && input.otp !== '123456') {
      throw new BadRequestError('Invalid 6-Digit Email OTP. Please check your Gmail or resend.');
    }

    delete otpStore[cleanEmail];

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === cleanEmail) {
        throw new ConflictError('A user with this email address already exists.');
      }
      throw new ConflictError('A user with this phone number already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);
    const userRole = input.role || UserRole.CUSTOMER;

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: cleanEmail,
        phone: input.phone ? input.phone.trim() : null,
        passwordHash,
        role: userRole,
        isEmailVerified: true,
        ...(userRole === UserRole.DELIVERY_PARTNER
          ? {
              deliveryProfile: {
                create: {
                  isVerified: true,
                  vehicleType: 'Motorcycle / Scooter',
                },
              },
            }
          : {}),
      },
    });

    // Save initial address if provided
    if (input.addressLine1 && userRole === UserRole.CUSTOMER) {
      await prisma.address.create({
        data: {
          userId: user.id,
          label: 'Home',
          addressLine1: input.addressLine1.trim(),
          city: input.city ? input.city.trim() : 'Coimbatore',
          state: 'Tamil Nadu',
          pincode: input.pincode ? input.pincode.trim() : '641018',
          isDefault: true,
        },
      });
    }

    const accessToken = signAccessToken(user.id, user.role as UserRole);
    const refreshToken = signRefreshToken(user.id);

    return {
      user: formatUserResponse(user as any),
      accessToken,
      refreshToken,
    };
  }

  static async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email.toLowerCase() },
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === input.email.toLowerCase()) {
        throw new ConflictError('A user with this email address already exists.');
      }
      throw new ConflictError('A user with this phone number already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const userRole = input.role || UserRole.CUSTOMER;

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone ? input.phone.trim() : null,
        passwordHash,
        role: userRole,
        isEmailVerified: true,
        ...(userRole === UserRole.DELIVERY_PARTNER
          ? {
              deliveryProfile: {
                create: {
                  isVerified: true,
                },
              },
            }
          : {}),
      },
    });

    const accessToken = signAccessToken(user.id, user.role as UserRole);
    const refreshToken = signRefreshToken(user.id);

    return {
      user: formatUserResponse(user as any),
      accessToken,
      refreshToken,
    };
  }

  static async login(input: LoginInput, expectedRole?: UserRole): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (expectedRole && user.role !== expectedRole) {
      throw new UnauthorizedError(`Unauthorized access for role: ${expectedRole}`);
    }

    const accessToken = signAccessToken(user.id, user.role as UserRole);
    const refreshToken = signRefreshToken(user.id);

    return {
      user: formatUserResponse(user as any),
      accessToken,
      refreshToken,
    };
  }

  static async refreshAccessToken(refreshTokenStr: string): Promise<{ accessToken: string }> {
    const payload = verifyRefreshToken(refreshTokenStr);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive.');
    }

    const accessToken = signAccessToken(user.id, user.role as UserRole);
    return { accessToken };
  }

  static async getUserProfile(userId: string): Promise<UserPublic> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found.');
    }

    return formatUserResponse(user as any);
  }
}
