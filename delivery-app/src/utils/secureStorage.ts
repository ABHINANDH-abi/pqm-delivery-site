import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'rd_delivery_access_token';
const REFRESH_TOKEN_KEY = 'rd_delivery_refresh_token';

let memoryStorage: Record<string, string> = {};

export async function saveItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    memoryStorage[key] = value;
  }
}

export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryStorage[key] || null;
  }
}

export async function deleteItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    delete memoryStorage[key];
  }
}

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => saveItem(ACCESS_TOKEN_KEY, token),
  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => saveItem(REFRESH_TOKEN_KEY, token),
  clearTokens: async () => {
    await deleteItem(ACCESS_TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
  },
};
