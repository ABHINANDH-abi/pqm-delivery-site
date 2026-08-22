import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import { CreateOrderInput, UpdateOrderStatusInput } from './orders.validation';
import { OrderStatus, UserRole } from '@prisma/client';
import { notificationsService } from '../notifications/notifications.service';

const FLAT_DELIVERY_FEE = 40;
const TAX_RATE = 0.05; // 5% GST

// Valid state transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
  ACCEPTED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.ASSIGNED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  ASSIGNED: [OrderStatus.PICKED_UP, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  PICKED_UP: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

export class OrdersService {
  /**
   * Place a new order with price & address snapshots
   */
  async createOrder(customerId: string, input: CreateOrderInput) {
    const { addressId, items, paymentMethod, customerNotes } = input;

    // 1. Verify delivery address
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== customerId) {
      throw new NotFoundError('Delivery address not found');
    }

    // 2. Fetch products & validate availability
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundError('One or more selected products are invalid');
    }

    const unavailableProduct = products.find((p) => !p.isAvailable);
    if (unavailableProduct) {
      throw new BadRequestError(`"${unavailableProduct.name}" is currently out of stock`);
    }

    // 3. Calculate snapshot prices
    let subtotal = 0;
    const orderItemData = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      return {
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        totalPrice,
      };
    });

    const deliveryFee = FLAT_DELIVERY_FEE;
    const discountAmount = 0;
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const totalAmount = subtotal + deliveryFee + taxAmount - discountAmount;

    // 4. Address snapshot text
    const addressText = `${address.label}: ${address.addressLine1}${
      address.addressLine2 ? ', ' + address.addressLine2 : ''
    }, ${address.city}, ${address.state} - ${address.pincode}`;

    // 5. Create Order & OrderItems
    const order = await prisma.order.create({
      data: {
        customerId,
        deliveryAddressId: addressId,
        deliveryAddressText: addressText,
        status: OrderStatus.PLACED,
        subtotal,
        deliveryFee,
        discountAmount,
        totalAmount,
        notes: customerNotes,
        items: {
          create: orderItemData,
        },
        payment: {
          create: {
            method: paymentMethod,
            status: 'PENDING',
            amount: totalAmount,
          },
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
    });

    return order;
  }

  /**
   * Get all orders for customer or admin (with optional filters)
   */
  async getOrders(userId: string, userRole: UserRole, statusFilter?: OrderStatus) {
    const where: any = {};

    if (userRole === UserRole.CUSTOMER) {
      where.customerId = userId;
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    return prisma.order.findMany({
      where,
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
        deliveryPartner: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get detailed order info by ID
   */
  async getOrderById(orderId: string, userId: string, userRole: UserRole) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                imageUrl: true,
                isVeg: true,
              },
            },
          },
        },
        payment: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        deliveryPartner: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Access control check
    if (userRole === UserRole.CUSTOMER && order.customerId !== userId) {
      throw new ForbiddenError('Access denied to this order');
    }

    return order;
  }

  /**
   * Update order status (Admin or Delivery Partner)
   */
  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const currentStatus = order.status;
    const newStatus = input.status;

    // Validate state transition
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus];
    if (allowedNextStatuses && !allowedNextStatuses.includes(newStatus) && currentStatus !== newStatus) {
      throw new BadRequestError(
        `Cannot transition order status from "${currentStatus}" to "${newStatus}"`
      );
    }

    const updateData: any = {
      status: newStatus,
      cancellationReason: input.cancellationReason || order.cancellationReason,
    };

    // Set timestamps per status
    if (newStatus === OrderStatus.ACCEPTED) updateData.acceptedAt = new Date();
    if (newStatus === OrderStatus.PREPARING) updateData.preparingAt = new Date();
    if (newStatus === OrderStatus.READY) updateData.readyAt = new Date();
    if (newStatus === OrderStatus.PICKED_UP) updateData.pickedUpAt = new Date();
    if (newStatus === OrderStatus.OUT_FOR_DELIVERY) updateData.outForDeliveryAt = new Date();
    if (newStatus === OrderStatus.DELIVERED) updateData.deliveredAt = new Date();
    if (newStatus === OrderStatus.CANCELLED) updateData.cancelledAt = new Date();
    if (newStatus === OrderStatus.REJECTED) updateData.rejectedAt = new Date();

    const updatedOrder = await prisma.order.update({
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

    // Auto-dispatch push notification for order status change
    notificationsService.sendOrderStatusNotification(orderId, newStatus).catch(err => {
      console.log('Notification dispatch warning:', err.message);
    });

    return updatedOrder;
  }

  /**
   * Customer order cancellation
   */
  async cancelOrder(orderId: string, customerId: string, reason?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenError('Access denied to cancel this order');
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new BadRequestError(
        'Order can only be cancelled while it is in "PLACED" status'
      );
    }

    return this.updateOrderStatus(orderId, {
      status: OrderStatus.CANCELLED,
      cancellationReason: reason || 'Cancelled by customer',
    });
  }
}

export const ordersService = new OrdersService();
