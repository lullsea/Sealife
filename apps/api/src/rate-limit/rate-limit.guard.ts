import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { REDIS, type Redis } from '../redis/redis.client';

export const RATE_LIMIT_KEY = 'rateLimit';

export type RateLimitRule = {
  // Part of the Redis key, rl:<name>:<id>, so it must be unique per rule.
  name: string;
  // At most `limit` requests per `windowSeconds`...
  limit: number;
  windowSeconds: number;
  // ...per whatever this returns (an IP, an email). undefined skips the rule.
  key: (req: Request) => string | undefined;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules =
      this.reflector.get<RateLimitRule[] | undefined>(
        RATE_LIMIT_KEY,
        context.getHandler(),
      ) ?? [];
    if (rules.length === 0) return true;

    // Fail open (§6). Checked up front because MULTI, unlike single commands,
    // ignores disableOfflineQueue and would wait for a reconnect attempt first.
    if (!this.redis.isReady) {
      this.logger.warn('Redis unavailable, rate limits skipped');
      return true;
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();

    for (const rule of rules) {
      const id = rule.key(req);
      if (!id) continue;
      const key = `rl:${rule.name}:${id}`;

      let count: number;
      let ttl: number;
      try {
        // One round trip, run as a unit (§3.2): count this request, start the
        // window on its first request (NX: only if there's no TTL yet), and
        // read how much of the window is left.
        [count, , ttl] = await this.redis
          .multi()
          .incr(key)
          .expire(key, rule.windowSeconds, 'NX')
          .ttl(key)
          .execTyped(); // typed per command: [number, number, number]
      } catch (err) {
        // Redis went away mid-request. Same decision: fail open.
        this.logger.warn(`${rule.name} skipped: ${String(err)}`);
        continue;
      }

      if (count > rule.limit) {
        http.getResponse<Response>().setHeader('Retry-After', ttl);
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
    return true;
  }
}
