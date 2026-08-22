import { Request, Response, NextFunction } from 'express';
import { deliveryService } from './delivery.service';
import { sendSuccess } from '../../utils/response';

export class DeliveryController {
  async getAssignedOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const orders = await deliveryService.getAssignedOrders(userId);
      return sendSuccess(res, orders, 'Assigned delivery orders retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAvailableOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await deliveryService.getAvailableOrders();
      return sendSuccess(res, orders, 'Available delivery orders retrieved');
    } catch (error) {
      next(error);
    }
  }

  async assignOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const targetPartnerId = req.body['deliveryPartnerId'];

      const order = await deliveryService.assignOrder(id!, userId, targetPartnerId);
      return sendSuccess(res, order, 'Order assigned to delivery partner successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const { status } = req.body;

      const order = await deliveryService.updateDeliveryStatus(id!, userId, status);
      return sendSuccess(res, order, 'Delivery status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { latitude, longitude, isOnline } = req.body;

      const partner = await deliveryService.updateLocation(userId, latitude, longitude, isOnline);
      return sendSuccess(res, partner, 'Delivery location updated');
    } catch (error) {
      next(error);
    }
  }
}

export const deliveryController = new DeliveryController();
