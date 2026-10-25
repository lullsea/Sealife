import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsModule } from './habits/habits.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { dataSourceOptions } from './database/data-source';

// Root module. Nest only knows about modules reachable from here.
@Module({
  imports: [
    // Opens the DB connection once; Nest closes it on shutdown.
    TypeOrmModule.forRoot(dataSourceOptions),
    HabitsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
