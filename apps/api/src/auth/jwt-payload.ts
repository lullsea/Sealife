import type { Request } from 'express';
import { UserRole } from '../users/user.entity';

// How long an access token lives.
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export type JWTPayload = {
  sub: number;
  email: string;
  role: UserRole;
  iat: number;
  jti: string; // JWT ID: a rando id per token, so a single token can be indexed and revoked
  exp: number;
};

export type AccessToken = {
  jti: string;
  exp: number;
};

export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};

export type AuthRequest = Request & {
  user: AuthUser;
  accessToken: AccessToken;
};
