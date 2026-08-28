import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import { AuthTokenPayload } from '../../../shared/src/types/user.types';

/**
 * Middleware: authenticate
 * Verifies the JWT access token from the Authorization header.
 * On success, attaches `req.user` for downstream handlers.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authorization token is required.'));
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  try {
    const payload = jwt.verify(token, env.jwt.secret) as AuthTokenPayload;
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired authorization token.'));
  }
}

/**
 * Middleware factory: authorizeRoles
 * Restricts access to users with the specified role(s).
 * Must be used AFTER the authenticate middleware.
 *
 * Usage:
 *   router.get('/admin/orders', authenticate, authorizeRoles(UserRole.ADMIN), handler)
 */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          'You do not have permission to access this resource.',
        ),
      );
    }

    next();
  };
}
