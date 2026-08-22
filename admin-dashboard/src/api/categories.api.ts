import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const categoriesApi = {
  getAll: async (includeInactive = true): Promise<Category[]> => {
    const res = await apiClient.get('/categories', {
      params: { includeInactive },
    });
    return res.data.data;
  },

  create: async (data: CreateCategoryPayload): Promise<Category> => {
    const res = await apiClient.post('/categories', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<CreateCategoryPayload>): Promise<Category> => {
    const res = await apiClient.patch(`/categories/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
