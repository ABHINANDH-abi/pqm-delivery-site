import { create } from 'zustand';
import { UserPublic } from '../types';
import { AuthService, LoginPayload, RegisterPayload } from '../services/auth.service';
import { tokenStorage } from '../utils/secureStorage';

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyOtpAndRegister: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user = await AuthService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (payload: LoginPayload) => {
    try {
      set({ isLoading: true, error: null });
      const data = await AuthService.login(payload);
      await tokenStorage.setAccessToken(data.accessToken);
      await tokenStorage.setRefreshToken(data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  verifyOtpAndRegister: async (payload: any) => {
    try {
      set({ isLoading: true, error: null });
      const data = await AuthService.verifyOtpAndRegister(payload);
      await tokenStorage.setAccessToken(data.accessToken);
      await tokenStorage.setRefreshToken(data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'OTP Verification failed.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (payload: RegisterPayload) => {
    try {
      set({ isLoading: true, error: null });
      const data = await AuthService.register(payload);
      await tokenStorage.setAccessToken(data.accessToken);
      await tokenStorage.setRefreshToken(data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Registration failed.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    await tokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
