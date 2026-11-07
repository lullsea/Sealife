import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { REDIS, type Redis } from '../src/redis/redis.client';

export const PASSWORD = 'Str0ng!Passw0rd';

export type TokenPair = { accessToken: string; refreshToken: string };

// The whole app, against the test database and test Redis that setup-e2e.ts
// selected. One per test file: create it in beforeAll, reset() in beforeEach,
// close it in afterAll.
export async function createE2eApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app); // same pipes and prefix as main.ts
  // A real port, not just init(): otherwise supertest starts and stops the
  // server around each request, and parallel requests can hit a closed one.
  await app.listen(0, '127.0.0.1');

  // The app's own connections, so the tests see exactly what the app sees.
  const dataSource = app.get(DataSource);
  const redis = app.get<Redis>(REDIS);
  await dataSource.runMigrations();

  const http = () => request(app.getHttpServer());

  return {
    app,
    dataSource,
    redis,
    http,

    // Empty every app table and the test Redis database. Called before each
    // test, not after, so a failed test leaves its data behind to inspect.
    // entityMetadatas lists only the app's tables, so TypeORM's "migrations"
    // table survives.
    async reset(): Promise<void> {
      const tables = dataSource.entityMetadatas
        .map((meta) => `"${meta.tableName}"`)
        .join(', ');
      await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
      await redis.flushDb();
    },

    async signUp(email = 'alice@test.com'): Promise<number> {
      const res = await http()
        .post('/api/users')
        .send({ email, password: PASSWORD })
        .expect(201);
      return (res.body as { id: number }).id;
    },

    async login(email = 'alice@test.com'): Promise<TokenPair> {
      const res = await http()
        .post('/api/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);
      return res.body as TokenPair;
    },
  };
}

export type E2eApp = Awaited<ReturnType<typeof createE2eApp>>;

export const bearer = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
