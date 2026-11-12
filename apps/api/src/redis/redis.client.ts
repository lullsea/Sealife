import { Logger } from '@nestjs/common';
import { createClient } from 'redis';

// The injection token for the client. A class can be its own token
// (UsersService), but a value built by a factory needs a name. A Symbol can't
// collide with any other token.
export const REDIS = Symbol('REDIS');

const logger = new Logger('Redis');

function createRedisClient(url: string) {
  return createClient({
    url,
    // While disconnected, reject commands at once instead of queueing them
    // until Redis is back. Each caller decides what a failure means (§6).
    disableOfflineQueue: true,
    // Slower than this counts as failed. Redis answers in well under 1 ms.
    commandOptions: { timeout: 500 },
  });
}

// The type of the client this app creates. createClient is generic, and
// ReturnType<typeof createClient> would give the most general version, which
// doesn't match what it actually returns for these options.
export type Redis = ReturnType<typeof createRedisClient>;

export async function connectRedis(url: string): Promise<Redis> {
  if (!url) {
    // Fail at startup, not on the first request that needs Redis.
    throw new Error('REDIS_URL is not set (see apps/api/.env.example)');
  }

  const client = createRedisClient(url);

  // Handle connection states gracefully
  client.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    logger.log('Redis client connecting...');
  });

  client.on('ready', () => {
    logger.log('Redis client connected and ready to use.');
  });

  // Resolves once connected. If Redis isn't running, startup waits here and
  // the warning above repeats until it is.
  await client.connect();
  return client;
}
