import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { Habit } from './habit.entity';
import { HabitCompletion } from './habit-completion.entity';

// Groups everything for the "habits" feature.
@Module({
  // Makes Repository<Habit> and Repository<HabitCompletion> injectable here.
  imports: [TypeOrmModule.forFeature([Habit, HabitCompletion])],
  controllers: [HabitsController],
  providers: [HabitsService],
  // Uncomment when another module needs HabitsService:
  // exports: [HabitsService],
})
export class HabitsModule {}
