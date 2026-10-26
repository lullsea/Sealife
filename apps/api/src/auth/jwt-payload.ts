import type { Request } from 'express';

export type JWTPayload = {
  sub: number;
  email: string;
  iat: number;
  exp: number;
};

export type AuthUser = {
  id: number;
  email: string;
};

export type AuthRequest = Request & { user: AuthUser };
