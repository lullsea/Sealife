import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { REDIS, type Redis } from './redis.client';

export type ReleaseLock = () => Promise<void>;

@Injectable()
export class RedisLock {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  // Tries once. Returns a function that releases the lock, or null if someone
  // else holds it. ttlMs is the safety net: if this process dies while holding
  // the lock, Redis deletes it after ttlMs, so nobody waits forever.
  async acquire(key: string, ttlMs: number): Promise<ReleaseLock | null> {
    // A value only this caller knows, so release can check whose lock it is.
    const token = randomUUID();
    const reply = await this.redis.set(key, token, {
      condition: 'NX', // only if nobody holds it
      expiration: { type: 'PX', value: ttlMs },
    });
    if (reply !== 'OK') return null;

    return async () => {
      // Delete only if the value is still ours (§7.3). If our ttl ran out and
      // someone else has the lock now, a plain DEL would delete *theirs*.
      // If this fails, the ttl removes the lock anyway.
      await this.redis
        .delEx(key, { condition: 'IFEQ', matchValue: token })
        .catch(() => {});
    };
  }
}
