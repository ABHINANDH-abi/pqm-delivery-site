import axios from 'axios';

const ACCESS_TOKEN_KEY = 'rd_admin_access_token';
const REFRESH_TOKEN_KEY = 'rd_admin_refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

const PRIMARY_URL = import.meta.env['VITE_API_BASE_URL'] ?? 'https://qureshi-mandi-backend.onrender.com/api/v1';
const FALLBACK_URL = 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: PRIMARY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
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
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
        );

        const newAccessToken = res.data.data.accessToken;
        tokenStorage.setAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Auto-failover retry if primary host is unreachable or DNS drops
    if ((error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) && !originalRequest._networkRetried) {
      originalRequest._networkRetried = true;
      const currentUrl = originalRequest.baseURL || apiClient.defaults.baseURL || '';

      if (currentUrl.includes('onrender.com')) {
        originalRequest.baseURL = FALLBACK_URL;
      } else {
        originalRequest.baseURL = PRIMARY_URL;
      }
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
