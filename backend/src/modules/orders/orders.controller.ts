import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { sendSuccess } from '../../utils/response';
import { OrderStatus } from '@prisma/client';

export class OrdersController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.user!.userId;
      const order = await ordersService.createOrder(customerId, req.body);
      return sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;
      const statusFilter = req.query['status'] as OrderStatus | undefined;

      const orders = await ordersService.getOrders(userId, role, statusFilter);
      return sendSuccess(res, orders, 'Orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const order = await ordersService.getOrderById(id!, userId, role);
      return sendSuccess(res, order, 'Order retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await ordersService.updateOrderStatus(id!, req.body);
      return sendSuccess(res, order, 'Order status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customerId = req.user!.userId;
      const reason = req.body['reason'];

      const order = await ordersService.cancelOrder(id!, customerId, reason);
      return sendSuccess(res, order, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const ordersController = new OrdersController();
