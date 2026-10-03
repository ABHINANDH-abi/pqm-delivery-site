import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../utils/response';

export class SettingsController {
  async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getSettings();
      return sendSuccess(res, settings, 'Settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.updateSettings(req.body);
      return sendSuccess(res, settings, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
