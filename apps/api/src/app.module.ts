import { Module } from '@nestjs/common';
import { HabitsModule } from './habits/habits.module';

// Root module. Nest only knows about modules reachable from here.
@Module({
  imports: [HabitsModule],
})
export class AppModule {}
