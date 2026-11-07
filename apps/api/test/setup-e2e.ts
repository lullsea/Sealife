// Runs before each e2e test file, so before anything imports data-source.ts
// or connects to Redis.
import 'dotenv/config';

const databaseUrl = process.env.TEST_DATABASE_URL;
const redisUrl = process.env.TEST_REDIS_URL;

// The tests empty every table and flush their Redis database. Refuse to run
// against anything that isn't obviously meant for tests.
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error(
    'TEST_DATABASE_URL must point at a database whose name ends in _test (see .env.example)',
  );
}

// redis://host:port/1 selects database 1. No path means database 0, the app's.
const redisDb = redisUrl ? Number(new URL(redisUrl).pathname.slice(1)) : 0;
if (!redisUrl || !(redisDb > 0)) {
  throw new Error(
    'TEST_REDIS_URL must select a Redis database other than 0, e.g. redis://localhost:6379/1 (see .env.example)',
  );
}

// The app reads these. dotenv never overwrites a variable that is already
// set, so the app's own `import 'dotenv/config'` won't undo this.
process.env.DATABASE_URL = databaseUrl;
process.env.REDIS_URL = redisUrl;
