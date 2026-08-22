import { create } from 'zustand';
import { UserPublic, UserRole } from '../types';
import { AuthService, LoginPayload } from '../services/auth.service';
import { tokenStorage } from '../api/client';

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
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
      const token = tokenStorage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user = await AuthService.getMe();
      if (user.role !== UserRole.ADMIN) {
        tokenStorage.clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false, error: 'Access denied: Admin accounts only.' });
        return;
      }

      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (payload: LoginPayload) => {
    try {
      set({ isLoading: true, error: null });
      const data = await AuthService.login(payload);

      if (data.user.role !== UserRole.ADMIN) {
        throw new Error('Access denied: Only administrators can access this portal.');
      }

      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setRefreshToken(data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Login failed.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    tokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
