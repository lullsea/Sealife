import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsModule } from './habits/habits.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { dataSourceOptions } from './database/data-source';
import { APP_FILTER } from '@nestjs/core';
import { QueryFailedExceptionsFilter } from './QueryFailedExceptions.filter';

// Root module. Nest only knows about modules reachable from here.
@Module({
  imports: [
    // Opens the DB connection once; Nest closes it on shutdown.
    TypeOrmModule.forRoot(dataSourceOptions),
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
