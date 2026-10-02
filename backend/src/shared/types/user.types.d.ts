import { UserRole } from '../constants/roles';
export interface UserPublic {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
}
export interface AuthTokenPayload {
    userId: string;
    role: UserRole;
}
//# sourceMappingURL=user.types.d.ts.map