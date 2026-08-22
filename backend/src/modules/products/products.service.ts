import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { CreateProductInput, UpdateProductInput } from './products.validation';

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
}

export class ProductsService {
  /**
   * Get products with optional category, search query, veg, and availability filters
   */
  async getAllProducts(filters: ProductFilters = {}) {
    const { categoryId, search, isVeg, isAvailable } = filters;

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isVeg !== undefined) {
      where.isVeg = isVeg;
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductInput) {
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return prisma.product.create({
      data: {
        ...data,
        price: data.price,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Update product details
   */
  async updateProduct(id: string, data: UpdateProductInput) {
    await this.getProductById(id);

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  /**
   * Toggle product availability status (Instant stock switch)
   */
  async toggleAvailability(id: string) {
    const product = await this.getProductById(id);

    return prisma.product.update({
      where: { id },
      data: {
        isAvailable: !product.isAvailable,
      },
    });
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string) {
    await this.getProductById(id);

    return prisma.product.delete({
      where: { id },
    });
  }
}

export const productsService = new ProductsService();
