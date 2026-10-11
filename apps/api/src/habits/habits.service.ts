import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHabitDTO } from './dto/create-habit';
import type { Habit, HabitCompletion } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Business logic lives here. No HTTP concepts (requests, status codes, routes).
// @Injectable() lets Nest create this class and inject it into others.
@Injectable()
export class HabitsService {
  // Nest injects PrismaService (exported by PrismaModule, imported in HabitsModule).
  constructor(private readonly prisma: PrismaService) {}

  // SELECT * FROM "Habit"
  findAll(): Promise<Habit[]> {
    return this.prisma.habit.findMany();
  }

  async findOne(id: number): Promise<Habit> {
    // findUnique resolves to null (not an error) when no row matches.
    const habit = await this.prisma.habit.findUnique({ where: { id } });
    if (!habit) {
      // Nest turns this into a 404 response automatically.
      throw new NotFoundException(`Habit ${id} not found`);
    }
    return habit;
  }

  // INSERT INTO "Habit". The DB assigns id and createdAt.
  create(dto: CreateHabitDTO): Promise<Habit> {
    return this.prisma.habit.create({
      data: { name: dto.name, description: dto.description },
    });
  }

  // INSERT INTO "HabitCompletion". findOne throws 404 if the habit is missing,
  // so no null check is needed here.
  async complete(habitId: number): Promise<HabitCompletion> {
    await this.findOne(habitId);
    // Prisma queries are lazy: nothing runs until the promise is awaited or
    // returned. A bare `this.prisma.x.create(...)` with no return never executes.
    return this.prisma.habitCompletion.create({ data: { habitId } });
  }

  // SELECT * FROM "HabitCompletion" WHERE "habitId" = ? ORDER BY "completedAt" DESC
  // Uses the @@index([habitId]) from the schema.
  async findCompletions(habitId: number): Promise<HabitCompletion[]> {
    await this.findOne(habitId); // 404 if the habit doesn't exist
    return this.prisma.habitCompletion.findMany({
      where: { habitId },
      orderBy: { completedAt: 'desc' },
    });
  }
}
