import { apiClient } from './client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string | number;
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

export interface CreateProductPayload {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
}

export const productsApi = {
  getAll: async (filters: ProductFilters = {}): Promise<Product[]> => {
    const res = await apiClient.get('/products', { params: filters });
    return res.data.data;
  },

  getById: async (id: string): Promise<Product> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data.data;
  },

  create: async (data: CreateProductPayload): Promise<Product> => {
    const res = await apiClient.post('/products', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<CreateProductPayload>): Promise<Product> => {
    const res = await apiClient.patch(`/products/${id}`, data);
    return res.data.data;
  },

  toggleAvailability: async (id: string): Promise<Product> => {
    const res = await apiClient.patch(`/products/${id}/toggle-availability`);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
