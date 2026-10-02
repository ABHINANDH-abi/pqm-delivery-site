import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.validation';

export class CategoriesService {
  /**
   * Get all active categories (or all if includeInactive is true)
   */
  async getAllCategories(includeInactive = false) {
    return prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateCategoryInput) {
    await this.getCategoryById(id);

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete category (safely cleans up child products and order references)
   */
  async deleteCategory(id: string) {
    const category = await this.getCategoryById(id);

    // Find all products in this category
    const products = await prisma.product.findMany({
      where: { categoryId: id },
      select: { id: true, name: true },
    });

    const productIds = products.map((p) => p.id);

    if (productIds.length > 0) {
      // Check if any product has active kitchen orders
      const activeOrders = await prisma.order.count({
        where: {
          status: { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'] },
          items: { some: { productId: { in: productIds } } },
        },
      });

      if (activeOrders > 0) {
        throw new BadRequestError(
          `Cannot delete category "${category.name}" because it contains items with ${activeOrders} active order(s) in progress.`
        );
      }

      // Delete historical order item references for these products
      await prisma.orderItem.deleteMany({
        where: { productId: { in: productIds } },
      });

      // Delete all child products in this category
      await prisma.product.deleteMany({
        where: { categoryId: id },
      });
    }

    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoriesService = new CategoriesService();
