import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginDTO } from './dto/login';
import { PrismaService } from '../prisma/prisma.service';

const REFRESH_TOKEN_TTL_DAYS = 7;
const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

// One message for every refresh failure, so an attacker can't tell which check failed.
const INVALID_REFRESH_TOKEN = 'Invalid refresh token';

export type TwinPair = {
  accessToken: string;
  refreshToken: string;
};

// 32 random bytes = 256 bits: unguessable, so no slow hash needed (Lesson 3, §3).
function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

// SHA-256 is deterministic, so the same token always gives the same hash
// and we can look it up with findUnique({ where: { tokenHash } }).
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // /auth/login
  async login({ email, password }: LoginDTO): Promise<TwinPair> {
    const user = await this.usersService.validateCredentials(email, password);

    return this.issueTokens(user);
  }

  // /auth/refresh
  async refresh(token: string): Promise<TwinPair> {
    const hashed = hashToken(token);
    // include the user: issueTokens needs their email, the row only has userId.
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashed },
      include: { user: true },
    });

    if (!refreshToken) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    // Already used once: someone is replaying it (§6). Log the user out everywhere.
    if (refreshToken.revokedAt) {
      await this.revokeAllForUser(refreshToken.userId);
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    // Old, not stolen: just reject it.
    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    // Rotation: revoke only this token. revokedAt: null makes the check and
    // the write one atomic step, so two concurrent requests can't both pass (§7).
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: refreshToken.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Another request revoked it between our read and our write: treat as reuse.
    if (count === 0) {
      await this.revokeAllForUser(refreshToken.userId);
      throw new UnauthorizedException(INVALID_REFRESH_TOKEN);
    }

    return this.issueTokens(refreshToken.user);
  }

  private async revokeAllForUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // /auth/logout
  // Revokes this one token (other devices stay logged in). Unknown or already
  // revoked tokens match nothing and that's fine: no error, so the response
  // never reveals whether a token existed.
  async logout(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: {
    id: number;
    email: string;
  }): Promise<TwinPair> {
    // Same JWT login used to sign: short-lived, checked by signature only.
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken();
    const hashed = hashToken(refreshToken);

    // Only the hash is stored. await it: without it, the response could go
    // out before the row exists, and a DB error would go unnoticed.
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashed,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    // The raw refresh token goes to the client. After this, the server
    // can't recover it, only check it against the hash.
    return { accessToken, refreshToken };
  }
}
