import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreateAddressInput, UpdateAddressInput } from './addresses.validation';

export class AddressesService {
  /**
   * Get all saved addresses for a user
   */
  async getUserAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get address by ID for a user
   */
  async getAddressById(userId: string, id: string) {
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenError('Access denied to this address');
    }

    return address;
  }

  /**
   * Add a new delivery address
   */
  async createAddress(userId: string, data: CreateAddressInput) {
    // If setting as default or if it's the first address, reset other default addresses
    const existingCount = await prisma.address.count({ where: { userId } });
    const shouldBeDefault = data.isDefault || existingCount === 0;

    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: {
        label: data.label,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city || 'Coimbatore',
        state: data.state || 'Tamil Nadu',
        pincode: data.pincode || '641018',
        landmark: data.landmark || undefined,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        userId,
        isDefault: shouldBeDefault,
      },
    });
  }

  /**
   * Update address
   */
  async updateAddress(userId: string, id: string, data: UpdateAddressInput) {
    await this.getAddressById(userId, id);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id },
      data,
    });
  }

  /**
   * Set an address as default
   */
  async setDefaultAddress(userId: string, id: string) {
    await this.getAddressById(userId, id);

    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  /**
   * Delete address
   */
  async deleteAddress(userId: string, id: string) {
    const address = await this.getAddressById(userId, id);

    await prisma.address.delete({
      where: { id },
    });

    // If deleted address was default, make the most recent remaining address default
    if (address.isDefault) {
      const firstRemaining = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (firstRemaining) {
        await prisma.address.update({
          where: { id: firstRemaining.id },
          data: { isDefault: true },
        });
      }
    }
  }
}

export const addressesService = new AddressesService();
