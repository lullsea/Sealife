import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS, type Redis } from '../redis/redis.client';
import { ACCESS_TOKEN_TTL_SECONDS, type JWTPayload } from './jwt-payload';

// AuthGuard checks an access token by its signature only, so the database
// can't take one back. These two keys can. Both expire by themselves once
// every token they could affect has expired, so nothing needs cleaning up.
@Injectable()
export class TokenRevocationService {
  private readonly logger = new Logger(TokenRevocationService.name);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  // One token: logout on one device. EXAT = expire at the token's own exp.
  async revokeToken(jti: string, exp: number): Promise<void> {
    await this.redis
      .set(`auth:denied:${jti}`, 1, {
        expiration: { type: 'EXAT', value: exp },
      })
      .catch((err: Error) => this.skipped('revokeToken', err));
  }

  // Every token this user holds right now: role change, deletion, theft.
  async revokeAllTokens(userId: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000); // seconds, like iat
    await this.redis
      .set(`auth:revoked-before:${userId}`, now, {
        expiration: { type: 'EX', value: ACCESS_TOKEN_TTL_SECONDS },
      })
      .catch((err: Error) => this.skipped('revokeAllTokens', err));
  }

  async isRevoked({ sub, jti, iat }: JWTPayload): Promise<boolean> {
    try {
      // Sent in the same tick, so the client pipelines them: one round trip.
      const [denied, cutoff] = await Promise.all([
        this.redis.exists(`auth:denied:${jti}`),
        this.redis.get(`auth:revoked-before:${sub}`),
      ]);
      // <=, not <: iat is in whole seconds, so a token from the same second as
      // the cutoff may be older than it. Reject it to be safe (§4.4).
      return denied === 1 || (cutoff !== null && iat <= Number(cutoff));
    } catch (err) {
      this.skipped('isRevoked', err as Error);
      return false; // fail open (§6)
    }
  }

  private skipped(what: string, err: Error) {
    this.logger.warn(`${what} skipped, Redis unavailable: ${err.message}`);
  }
}
