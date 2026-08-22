import { Request, Response, NextFunction } from 'express';
import { addressesService } from './addresses.service';
import { sendSuccess } from '../../utils/response';

export class AddressesController {
  async getMyAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const addresses = await addressesService.getUserAddresses(userId);
      return sendSuccess(res, addresses, 'Addresses retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const address = await addressesService.createAddress(userId, req.body);
      return sendSuccess(res, address, 'Address added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const address = await addressesService.updateAddress(userId, id!, req.body);
      return sendSuccess(res, address, 'Address updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const address = await addressesService.setDefaultAddress(userId, id!);
      return sendSuccess(res, address, 'Default address set successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await addressesService.deleteAddress(userId, id!);
      return sendSuccess(res, null, 'Address deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const addressesController = new AddressesController();
