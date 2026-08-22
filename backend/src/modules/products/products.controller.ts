import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { sendSuccess } from '../../utils/response';

export class ProductsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = req.query['categoryId'] as string | undefined;
      const search = req.query['search'] as string | undefined;
      const isVegStr = req.query['isVeg'] as string | undefined;
      const isAvailableStr = req.query['isAvailable'] as string | undefined;

      const filters = {
        categoryId,
        search,
        isVeg: isVegStr === 'true' ? true : isVegStr === 'false' ? false : undefined,
        isAvailable: isAvailableStr === 'true' ? true : isAvailableStr === 'false' ? false : undefined,
      };

      const products = await productsService.getAllProducts(filters);
      return sendSuccess(res, products, 'Products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productsService.getProductById(id!);
      return sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productsService.createProduct(req.body);
      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productsService.updateProduct(id!, req.body);
      return sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productsService.toggleAvailability(id!);
      return sendSuccess(res, product, 'Product availability updated');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await productsService.deleteProduct(id!);
      return sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
