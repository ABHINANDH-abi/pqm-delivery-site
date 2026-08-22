import axios from 'axios';
import { tokenStorage } from '../utils/secureStorage';

export const apiClient = axios.create({
  baseURL: process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:4000/api/v1',
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

    return Promise.reject(error);
  },
);
