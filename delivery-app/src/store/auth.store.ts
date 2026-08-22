import { create } from 'zustand';
import { tokenStorage } from '../utils/secureStorage';
import { authApi, UserProfile } from '../api/auth.api';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login({ email, password });

      if (data.user.role !== 'DELIVERY_PARTNER' && data.user.role !== 'ADMIN') {
        throw new Error('Access denied: Account is not a registered Delivery Partner');
      }

      await tokenStorage.setAccessToken(data.accessToken);
      await tokenStorage.setRefreshToken(data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await tokenStorage.clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
