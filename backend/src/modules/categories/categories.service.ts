import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
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
   * Delete category
   */
  async deleteCategory(id: string) {
    await this.getCategoryById(id);

    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoriesService = new CategoriesService();
