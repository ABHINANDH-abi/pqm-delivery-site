import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UpdateSettingsInput {
  restaurantName?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: string;
  taxRatePercent?: number;
  flatDeliveryFee?: number;
  isAcceptingOrders?: boolean;
  merchantUpiId?: string;
  payeeName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
}

const DEFAULT_SETTINGS = {
  id: 'default',
  restaurantName: 'Qureshi Mandi Coimbatore',
  phone: '+91 98765 43210',
  email: 'contact@qureshimandi.com',
  address: '12, Qureshi Mandi Road, Coimbatore, Tamil Nadu 641001',
  openingHours: '11:00 AM - 11:00 PM',
  taxRatePercent: 5,
  flatDeliveryFee: 50,
  isAcceptingOrders: true,
  merchantUpiId: 'abinandanil12@oksbi',
  payeeName: 'Qureshi Mandi Coimbatore',
  bankAccountNumber: '923010045892147',
  bankIfscCode: 'UTIB0001892',
};

export class SettingsService {
  async getSettings() {
    try {
      let settings = await prisma.restaurantSetting.findUnique({
        where: { id: 'default' },
      });

      if (!settings) {
        settings = await prisma.restaurantSetting.create({
          data: DEFAULT_SETTINGS,
        });
      }

      return settings;
    } catch (error) {
      console.error('Error fetching settings from database, returning defaults:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(data: UpdateSettingsInput) {
    try {
      const updated = await prisma.restaurantSetting.upsert({
        where: { id: 'default' },
        update: {
          ...(data.restaurantName !== undefined && { restaurantName: data.restaurantName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.openingHours !== undefined && { openingHours: data.openingHours }),
          ...(data.taxRatePercent !== undefined && { taxRatePercent: Number(data.taxRatePercent) }),
          ...(data.flatDeliveryFee !== undefined && { flatDeliveryFee: Number(data.flatDeliveryFee) }),
          ...(data.isAcceptingOrders !== undefined && { isAcceptingOrders: Boolean(data.isAcceptingOrders) }),
          ...(data.merchantUpiId !== undefined && { merchantUpiId: data.merchantUpiId }),
          ...(data.payeeName !== undefined && { payeeName: data.payeeName }),
          ...(data.bankAccountNumber !== undefined && { bankAccountNumber: data.bankAccountNumber }),
          ...(data.bankIfscCode !== undefined && { bankIfscCode: data.bankIfscCode }),
        },
        create: {
          ...DEFAULT_SETTINGS,
          ...data,
          taxRatePercent: data.taxRatePercent !== undefined ? Number(data.taxRatePercent) : DEFAULT_SETTINGS.taxRatePercent,
          flatDeliveryFee: data.flatDeliveryFee !== undefined ? Number(data.flatDeliveryFee) : DEFAULT_SETTINGS.flatDeliveryFee,
        },
      });

      return updated;
    } catch (error) {
      console.error('Error saving settings to database:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
