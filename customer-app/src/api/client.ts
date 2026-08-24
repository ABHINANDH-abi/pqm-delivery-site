import axios from 'axios';
import { tokenStorage } from '../utils/secureStorage';

const PRIMARY_URL = process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://192.168.1.4:4000/api/v1';
const FALLBACK_URL = 'http://10.0.2.2:4000/api/v1';
const LOCALHOST_URL = 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: PRIMARY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatic fallback interceptor for Android Studio emulator (10.0.2.2) and physical phone Wi-Fi (192.168.1.4)
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 and token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
        );

        const newAccessToken = res.data.data.accessToken;
        await tokenStorage.setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle Network Error by attempting alternate host (10.0.2.2 -> 192.168.1.4 -> localhost)
    if ((error.code === 'ERR_NETWORK' || !error.response) && !originalRequest._networkRetried) {
      originalRequest._networkRetried = true;
      const currentUrl = originalRequest.baseURL || apiClient.defaults.baseURL || '';
      if (currentUrl.includes('10.0.2.2')) {
        originalRequest.baseURL = FALLBACK_URL;
      } else if (currentUrl.includes('192.168.1.4')) {
        originalRequest.baseURL = LOCALHOST_URL;
      } else {
        originalRequest.baseURL = PRIMARY_URL;
      }
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
