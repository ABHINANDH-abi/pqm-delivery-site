import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  isVeg: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const queryProductsSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  isVeg: z.string().optional(),
  isAvailable: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
