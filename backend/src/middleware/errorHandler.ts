import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors';
import { sendError } from '../utils/response';
import { env } from '../config/env';

/**
 * Global error handling middleware.
 * Must be the LAST middleware registered in server.ts.
 *
 * Handles:
 * - AppError subclasses (BadRequest, Unauthorized, NotFound, etc.)
 * - Zod validation errors (from validate middleware)
 * - Prisma errors (unique constraint, not found)
 * - Unexpected errors (logged, returned as 500)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 1. Known operational errors
  if (error instanceof ValidationError) {
    res.status(422).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    sendError(res, {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    });
    return;
  }

  // 2. Zod parsing errors (if not caught by validate middleware)
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || 'root';
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fieldErrors,
      },
    });
    return;
  }

  // 3. Prisma known error codes
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error
  ) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      const field = prismaError.meta?.target?.[0] ?? 'field';
      sendError(res, {
        statusCode: 409,
        code: 'CONFLICT',
        message: `A record with this ${field} already exists.`,
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      // Record not found
      sendError(res, {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'The requested record was not found.',
      });
      return;
    }
  }

  // 4. Unexpected / programming errors
  // Log full error in all environments, but never expose details to client
  console.error('[Unhandled Error]', error);

  sendError(res, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    details: env.isDevelopment ? error : undefined,
  });
}
