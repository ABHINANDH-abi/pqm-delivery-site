import { apiClient } from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', payload);
    return res.data.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/users/me');
    return res.data.data;
  },
};
