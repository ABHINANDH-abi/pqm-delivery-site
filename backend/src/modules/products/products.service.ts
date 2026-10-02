import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/errors';
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
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        isVeg: data.isVeg,
        isAvailable: data.isAvailable,
        sortOrder: data.sortOrder,
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
   * Delete product (safely handles historical order references)
   */
  async deleteProduct(id: string) {
    const product = await this.getProductById(id);

    // Check if the item is part of active orders currently in progress
    const activeOrders = await prisma.order.count({
      where: {
        status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
        items: { some: { productId: id } },
      },
    });

    if (activeOrders > 0) {
      throw new BadRequestError(
        `Cannot delete "${product.name}" while ${activeOrders} order(s) are active in kitchen. Please complete or cancel the active orders first, or turn off the Availability toggle to stop new orders.`
      );
    }

    // Clean up historical order item references so foreign key constraint is satisfied
    await prisma.orderItem.deleteMany({
      where: { productId: id },
    });

    return prisma.product.delete({
      where: { id },
    });
  }
}

export const productsService = new ProductsService();
