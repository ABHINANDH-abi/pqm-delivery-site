import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().min(1, 'Address label is required (e.g. Home, Work)'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional().nullable(),
  city: z.string().default('Coimbatore'),
  state: z.string().default('Tamil Nadu'),
  pincode: z.string().optional().nullable().transform((val) => {
    if (!val) return '641018';
    const clean = val.replace(/\D/g, '');
    return clean.length === 6 ? clean : '641018';
  }),
  landmark: z.string().optional().nullable(),
  latitude: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  longitude: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
