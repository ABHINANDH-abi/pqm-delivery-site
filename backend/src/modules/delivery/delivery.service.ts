import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export class DeliveryService {
  /**
   * Get or create DeliveryPartner record for a user
   */
  async getDeliveryPartnerByUserId(userId: string) {
    let partner = await prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    if (!partner) {
      // Auto-create DeliveryPartner profile for delivery partner role if missing
      partner = await prisma.deliveryPartner.create({
        data: {
          userId,
          vehicleType: 'BIKE',
          status: 'AVAILABLE',
        },
      });
    }

    return partner;
  }

  /**
   * Get orders assigned to delivery partner
   */
  async getAssignedOrders(userId: string) {
    const partner = await this.getDeliveryPartnerByUserId(userId);

    return prisma.order.findMany({
      where: {
        deliveryPartnerId: partner.id,
        status: {
          in: [
            OrderStatus.ASSIGNED,
            OrderStatus.READY,
            OrderStatus.PICKED_UP,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED,
          ],
        },
      },
      include: {
        items: true,
        payment: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get unassigned orders ready for delivery pickup
   */
  async getAvailableOrders() {
    return prisma.order.findMany({
      where: {
        deliveryPartnerId: null,
        status: {
          in: [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY],
        },
      },
      include: {
        items: true,
        payment: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Assign order to delivery partner
   */
  async assignOrder(orderId: string, userId: string, targetPartnerId?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    let partnerId = targetPartnerId;
    if (!partnerId) {
      const partner = await this.getDeliveryPartnerByUserId(userId);
      partnerId = partner.id;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPartnerId: partnerId,
        status: order.status === OrderStatus.PLACED ? OrderStatus.ACCEPTED : order.status,
        assignedAt: new Date(),
      },
      include: {
        items: true,
        payment: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * Update delivery order status (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
   */
  async updateDeliveryStatus(orderId: string, userId: string, nextStatus: OrderStatus) {
    const partner = await this.getDeliveryPartnerByUserId(userId);
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.deliveryPartnerId && order.deliveryPartnerId !== partner.id) {
      throw new ForbiddenError('This order is assigned to another delivery partner');
    }

    const updateData: any = {
      status: nextStatus,
      deliveryPartnerId: partner.id,
    };

    if (nextStatus === OrderStatus.PICKED_UP) updateData.pickedUpAt = new Date();
    if (nextStatus === OrderStatus.OUT_FOR_DELIVERY) updateData.outForDeliveryAt = new Date();
    if (nextStatus === OrderStatus.DELIVERED) updateData.deliveredAt = new Date();

    // Perform order update in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const resOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          items: true,
          payment: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // If delivered and payment is COD, mark payment as PAID
      if (nextStatus === OrderStatus.DELIVERED && resOrder.payment) {
        await tx.payment.update({
          where: { id: resOrder.payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });
      }

      return resOrder;
    });

    return updatedOrder;
  }

  /**
   * Update delivery partner live location & availability
   */
  async updateLocation(userId: string, latitude: number, longitude: number, isOnline = true) {
    const partner = await this.getDeliveryPartnerByUserId(userId);

    return prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        status: isOnline ? 'AVAILABLE' : 'OFFLINE',
      },
    });
  }
}

export const deliveryService = new DeliveryService();
