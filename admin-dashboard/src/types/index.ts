// Admin dashboard shared types
export type { UserPublic, AuthTokenPayload } from '../../../shared/src/types/user.types';
export type { ProductPublic, CategoryPublic } from '../../../shared/src/types/product.types';
export type { OrderPublic, OrderItemSnapshot } from '../../../shared/src/types/order.types';
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  PaginationMeta,
  PaginatedResponse,
} from '../../../shared/src/types/api.types';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  DELIVERY_PARTNER = 'DELIVERY_PARTNER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
