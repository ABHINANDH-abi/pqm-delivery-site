import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../utils/response';

export class NotificationsController {
  async registerFcmToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { fcmToken, deviceType } = req.body;
      const user = await notificationsService.registerFcmToken(userId, fcmToken, deviceType);
      return sendSuccess(res, { userId: user.id, fcmToken: user.fcmToken }, 'FCM Token registered');
    } catch (error) {
      next(error);
    }
  }

  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const notifications = await notificationsService.getUserNotifications(userId);
      return sendSuccess(res, notifications, 'Notifications retrieved');
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await notificationsService.markAsRead(userId, id!);
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
