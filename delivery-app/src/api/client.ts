import axios from 'axios';
import { tokenStorage } from '../utils/secureStorage';

const PRIMARY_URL = process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'https://qureshi-mandi-backend.onrender.com/api/v1';
const FALLBACK_URL = 'http://192.168.1.4:4000/api/v1';
const LOCALHOST_URL = 'http://10.0.2.2:4000/api/v1';

export const apiClient = axios.create({
  baseURL: PRIMARY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

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

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      }
    }

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
