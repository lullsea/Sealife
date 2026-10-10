import { Module } from '@nestjs/common';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';
import { PrismaModule } from '../prisma/prisma.module';

// Groups everything for the "habits" feature.
@Module({
  imports: [PrismaModule],
  controllers: [HabitsController],
  providers: [HabitsService],
  // Uncomment when another module needs HabitsService:
  // exports: [HabitsService],
})
export class HabitsModule {}
