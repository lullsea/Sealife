import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

// Groups everything for the "habits" feature.
@Module({
  controllers: [HabitsController],
  providers: [HabitsService],
  // Uncomment when another module needs HabitsService:
  // exports: [HabitsService],
})
export class HabitsModule {}
