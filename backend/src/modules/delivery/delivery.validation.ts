import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const assignOrderSchema = z.object({
  deliveryPartnerId: z.string().optional(), // if omitted, self-assigns logged in delivery partner
});

export const updateDeliveryStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  isOnline: z.boolean().optional(),
});

export type AssignOrderInput = z.infer<typeof assignOrderSchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
