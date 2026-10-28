import type { Request } from 'express';
import { UserRole } from '../users/user.entity';

export type JWTPayload = {
  sub: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
};

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};

export type AuthRequest = Request & { user: AuthUser };
