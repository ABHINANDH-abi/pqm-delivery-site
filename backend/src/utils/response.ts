import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse } from '../types/api';

/**
 * Send a standardised success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  optionsOrMessage: { statusCode?: number; message?: string } | string = {},
  extraCode?: number,
): void {
  const options = typeof optionsOrMessage === 'string' ? { message: optionsOrMessage, statusCode: extraCode } : optionsOrMessage;
  const { statusCode = extraCode || 200, message } = options;

  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  res.status(statusCode).json(body);
}

/**
 * Send a standardised error response.
 * Never expose stack traces or internal details in production.
 */
export function sendError(
  res: Response,
  options: {
    statusCode?: number;
    code: string;
    message: string;
    details?: unknown;
  },
): void {
  const { statusCode = 500, code, message, details } = options;

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(process.env['NODE_ENV'] === 'development' && details !== undefined
        ? { details }
        : {}),
    },
  };

  res.status(statusCode).json(body);
}
