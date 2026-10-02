import { prisma } from '../../config/database';
import { OrderStatus } from '@prisma/client';

export class NotificationsService {
  /**
   * Register FCM Device Token for a user
   */
  async registerFcmToken(userId: string, fcmToken: string, _deviceType = 'ANDROID') {
    console.log(`[FCM TOKEN REGISTERED] User: ${userId} | Token: "${fcmToken}"`);

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    if (partner) {
      await prisma.deliveryPartner.update({
        where: { id: partner.id },
        data: { fcmToken },
      });
    }

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
   * Helper to dispatch remote push notifications via Expo Push Service (HTTPS port 443)
   */
  async sendExpoPush(messages: Array<{
    to: string;
    title: string;
    body: string;
    sound?: string;
    priority?: string;
    channelId?: string;
    data?: any;
  }>) {
    if (!messages || messages.length === 0) return;

    // Filter valid tokens
    const validMessages = messages.filter((m) => m.to && m.to.trim().length > 0);
    if (validMessages.length === 0) return;

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validMessages),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[ExpoPush] Push service response note (${response.status}): ${errorText}`);
      } else {
        const resData: any = await response.json();
        console.log(`[ExpoPush] ✅ Dispatched ${validMessages.length} remote push notification(s)`);
      }
    } catch (err: any) {
      console.warn(`[ExpoPush] ⚠️ Push dispatch note: ${err.message}`);
    }
  }

  /**
   * Trigger high-priority mobile background alarm on all active delivery partner phones
   */
  async sendNewOrderDispatchPush(order: { id: string; totalAmount?: any; deliveryFee?: any; deliveryAddressText?: string }) {
    try {
      const shortId = order.id.slice(-6).toUpperCase();
      const fee = order.deliveryFee ? Number(order.deliveryFee) : 50;
      const title = '🚨 NEW ORDER AVAILABLE FOR PICKUP!';
      const bodyText = `Order #${shortId} (+₹${fee} delivery earning)\nDrop: ${order.deliveryAddressText || 'Customer Location'}\nTap to claim order!`;

      // 1. Find all active delivery partners
      const deliveryPartners = await prisma.deliveryPartner.findMany({
        include: { user: true },
      });

      // 2. Persist in-app notification rows for all partners
      for (const partner of deliveryPartners) {
        if (partner.user?.id) {
          await this.sendNotification(partner.user.id, title, bodyText, order.id);
        }
      }

      // 3. Dispatch High-Priority Alarm Push via Expo Push Service
      const pushMessages: any[] = [];
      for (const partner of deliveryPartners) {
        const token = partner.fcmToken || partner.user?.fcmToken;
        if (token) {
          pushMessages.push({
            to: token,
            title,
            body: bodyText,
            sound: 'default',
            priority: 'high',
            channelId: 'order_alerts_alarm',
            data: {
              orderId: order.id,
              type: 'NEW_ORDER_DISPATCH',
            },
          });
        }
      }

      if (pushMessages.length > 0) {
        await this.sendExpoPush(pushMessages);
        console.log(`[ExpoPush] 🔔 Broadcasted Order #${shortId} alarm push to ${pushMessages.length} driver device(s)`);
      } else {
        console.log(`[ExpoPush] Note: No delivery partners with registered tokens currently online for Order #${shortId}`);
      }
    } catch (err: any) {
      console.warn(`[ExpoPush] Dispatch error: ${err.message}`);
    }
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

    // 2. DISPATCH NOTIFICATION & ALARM TO ALL DELIVERY PARTNER PHONES WHEN ORDER IS ACCEPTED OR READY
    if (status === OrderStatus.ACCEPTED || status === OrderStatus.PREPARING || status === OrderStatus.READY) {
      await this.sendNewOrderDispatchPush(order);
    }
  }
}

export const notificationsService = new NotificationsService();
