import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().min(1, 'Address label is required (e.g. Home, Work)'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable().transform((val) => val ? val.trim() : ''),
  state: z.string().optional().nullable().transform((val) => val ? val.trim() : ''),
  pincode: z.string().optional().nullable().transform((val) => {
    if (!val) return '';
    const clean = val.replace(/\D/g, '');
    return clean;
  }),
  landmark: z.string().optional().nullable(),
  latitude: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  longitude: z.union([z.number(), z.string()]).optional().nullable().transform((val) => val ? Number(val) : null),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
