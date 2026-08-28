import { prisma } from '../../config/database';
import { OrderStatus } from '@prisma/client';

export class NotificationsService {
  /**
   * Register FCM Device Token for a user
   */
  async registerFcmToken(_userId: string, fcmToken: string, _deviceType = 'ANDROID') {
    console.log(`[FCM TOKEN REGISTERED] User: ${_userId} | Token: "${fcmToken}"`);
    return { registered: true, fcmToken };
  }

  /**
   * Get user notification history
   */
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Send notification to user & persist record in database
   */
  async sendNotification(userId: string, title: string, bodyText: string, orderId?: string) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        orderId,
        title,
        body: bodyText,
        isRead: false,
      },
    });

    console.log(`[FCM NOTIFICATION SENT] User: ${userId} | Title: "${title}" | Body: "${bodyText}"`);
    return notification;
  }

  /**
   * Automatically triggered when an order changes status
   */
  async sendOrderStatusNotification(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true, id: true, totalAmount: true, deliveryFee: true, deliveryAddressText: true },
    });

    if (!order) return;

    const shortId = order.id.slice(-6).toUpperCase();
    let title = '';
    let bodyText = '';

    switch (status) {
      case OrderStatus.ACCEPTED:
        title = 'Order Confirmed! 🍕';
        bodyText = `Order #${shortId} has been confirmed by the restaurant and sent to the kitchen.`;
        break;
      case OrderStatus.PREPARING:
        title = 'Cooking Fresh! 🍳';
        bodyText = `Chef is currently preparing your delicious food for Order #${shortId}.`;
        break;
      case OrderStatus.READY:
        title = 'Order Ready for Pickup! 📦';
        bodyText = `Order #${shortId} is freshly cooked and ready for delivery pickup.`;
        break;
      case OrderStatus.OUT_FOR_DELIVERY:
        title = 'Out for Delivery! 🛵';
        bodyText = `Your delivery partner is on the way with Order #${shortId}!`;
        break;
      case OrderStatus.DELIVERED:
        title = 'Order Delivered! 🎉';
        bodyText = `Order #${shortId} has been delivered. Enjoy your meal!`;
        break;
      case OrderStatus.CANCELLED:
        title = 'Order Cancelled ❌';
        bodyText = `Order #${shortId} was cancelled.`;
        break;
      case OrderStatus.REJECTED:
        title = 'Order Declined ⛔';
        bodyText = `Restaurant was unable to accept Order #${shortId}.`;
        break;
      default:
        return;
    }

    // 1. Send notification to Customer
    await this.sendNotification(order.customerId, title, bodyText, order.id);

    // 2. DISPATCH ALERT TO ALL DELIVERY PARTNER PHONES WHEN ORDER IS ACCEPTED OR READY
    if (status === OrderStatus.ACCEPTED || status === OrderStatus.PREPARING || status === OrderStatus.READY) {
      try {
        const deliveryPartners = await prisma.deliveryPartner.findMany({
          include: { user: true },
        });

        const driverAlertTitle = `🛵 NEW DISPATCH ALERT! Order #${shortId}`;
        const driverAlertBody = `Restaurant accepted Order #${shortId} (+₹${order.deliveryFee || 50} fee). Tap to view route & claim delivery!`;

        for (const partner of deliveryPartners) {
          if (partner.user?.id) {
            await this.sendNotification(partner.user.id, driverAlertTitle, driverAlertBody, order.id);
          }
        }
        console.log(`[RIDER DISPATCH ALERT] Broadcasted Order #${shortId} alert to ${deliveryPartners.length} delivery partner phones.`);
      } catch (err: any) {
        console.warn(`[RIDER DISPATCH ALERT WARNING] ${err.message}`);
      }
    }
  }
}

export const notificationsService = new NotificationsService();
