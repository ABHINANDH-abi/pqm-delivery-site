import { z } from 'zod';

export const registerFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM device token is required'),
  deviceType: z.enum(['ANDROID', 'IOS', 'WEB']).default('ANDROID'),
});

export type RegisterFcmTokenInput = z.infer<typeof registerFcmTokenSchema>;
