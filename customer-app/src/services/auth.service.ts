import { apiClient } from '../api/client';
import { UserPublic, ApiResponse, ApiSuccessResponse } from '../types';

export interface AuthResponseData {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpRegisterPayload extends RegisterPayload {
  otp: string;
  addressLine1?: string;
  city?: string;
  pincode?: string;
  role?: string;
}

export class AuthService {
  static async sendOtp(email: string, name?: string, phone?: string): Promise<{ message: string; email: string; otpDebug?: string }> {
    const res = await apiClient.post<ApiSuccessResponse<{ message: string; email: string; otpDebug?: string }>>('/auth/send-otp', {
      email,
      name,
      phone,
    });
    return res.data.data;
  }

  static async verifyOtpAndRegister(payload: VerifyOtpRegisterPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResponseData>>('/auth/verify-otp-and-register', payload);
    return res.data.data;
  }

  static async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResponseData>>('/auth/register', payload);
    return res.data.data;
  }

  static async login(payload: LoginPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiSuccessResponse<AuthResponseData>>('/auth/login', payload);
    return res.data.data;
  }

  static async getMe(): Promise<UserPublic> {
    const res = await apiClient.get<ApiSuccessResponse<{ user: UserPublic }>>('/users/me');
    return res.data.data.user;
  }

  static async refreshToken(refreshToken: string): Promise<string> {
    const res = await apiClient.post<ApiSuccessResponse<{ accessToken: string }>>('/auth/refresh-token', {
      refreshToken,
    });
    return res.data.data.accessToken;
  }
}
