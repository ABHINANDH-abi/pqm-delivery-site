import { apiClient } from '../api/client';
import { UserPublic, ApiSuccessResponse } from '../types';

export interface AuthResponseData {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export class AuthService {
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
