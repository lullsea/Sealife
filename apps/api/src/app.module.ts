import { Module } from '@nestjs/common';
import { HabitsModule } from './habits/habits.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

// Root module. Nest only knows about modules reachable from here.
@Module({
  imports: [HabitsModule, UsersModule, AuthModule],
})
export class AppModule {}
