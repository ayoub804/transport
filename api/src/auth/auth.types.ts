import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
