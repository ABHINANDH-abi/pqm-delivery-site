import { UserRole } from '../shared/constants/roles';

// Extend Express Request to carry the authenticated user payload
// after the auth middleware has verified the JWT.

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {};
