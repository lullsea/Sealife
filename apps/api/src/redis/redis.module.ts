import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { connectRedis, REDIS, type Redis } from './redis.client';
import { RedisLock } from './redis-lock.service';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';

// @Global: infrastructure any feature module may need, like the DB connection.
// Feature modules can inject REDIS without importing this module.
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (config: ConfigService<Env, true>) =>
        connectRedis(config.get('REDIS_URL', { infer: true })),
    },
    RedisLock,
  ],
  exports: [REDIS, RedisLock],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  // Runs on app.close(), and on Ctrl+C because main.ts enables shutdown hooks.
  async onApplicationShutdown() {
    await this.redis.close();
  }
}
