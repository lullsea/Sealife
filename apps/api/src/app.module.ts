import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsModule } from './habits/habits.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { dataSourceOptions } from './database/data-source';
import { APP_FILTER } from '@nestjs/core';
import { QueryFailedExceptionsFilter } from './QueryFailedExceptions.filter';
import { RedisModule } from './redis/redis.module';
import { validate, type Env } from './config/env.validation';

// Root module. Nest only knows about modules reachable from here.
@Module({
  imports: [
    // Loads .env, validates it, and fails startup if anything is wrong.
    // isGlobal: every module can inject ConfigService without importing this.
    ConfigModule.forRoot({ isGlobal: true, validate }),
    // Opens the DB connection once; Nest closes it on shutdown.
    // Async: the factory runs after ConfigModule has validated the env.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        ...dataSourceOptions,
        url: config.get('DATABASE_URL', { infer: true }),
      }),
    }),
    RedisModule,
    HabitsModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionsFilter,
    },
  ],
})
export class AppModule {}
