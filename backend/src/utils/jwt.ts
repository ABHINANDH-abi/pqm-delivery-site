import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthTokenPayload } from '../../../shared/src/types/user.types';
import { UserRole } from '../../../shared/src/constants/roles';
import { UnauthorizedError } from './errors';

// ─── Access Token ─────────────────────────────────────────────────────────────

export function signAccessToken(userId: string, role: UserRole): string {
  const payload: AuthTokenPayload = { userId, role };
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, env.jwt.secret) as AuthTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token.');
  }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { userId, type: 'refresh' };
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type.');
    }
    return payload;
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Invalid or expired refresh token.');
  }
}
