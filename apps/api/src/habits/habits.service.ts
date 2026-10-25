import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHabitDTO } from './dto/create-habit';
import { Habit } from './habit.entity';
import { HabitCompletion } from './habit-completion.entity';
import { UpdateHabitDTO } from './dto/update-habit';

// Business logic lives here. No HTTP concepts (requests, status codes, routes).
// @Injectable() lets Nest create this class and inject it into others.
@Injectable()
export class HabitsService {
  // Nest injects the repositories registered by TypeOrmModule.forFeature in HabitsModule.
  constructor(
    @InjectRepository(Habit) private readonly habits: Repository<Habit>,
    @InjectRepository(HabitCompletion)
    private readonly completions: Repository<HabitCompletion>,
  ) {}

  // SELECT * FROM "Habit"
  findAll(): Promise<Habit[]> {
    return this.habits.find();
  }

  async findOne(id: number): Promise<Habit> {
    // findOneBy resolves to null (not an error) when no row matches.
    const habit = await this.habits.findOneBy({ id });
    if (!habit) {
      // Nest turns this into a 404 response automatically.
      throw new NotFoundException(`Habit ${id} not found`);
    }
    return habit;
  }

  // INSERT INTO "Habit". The DB assigns id and createdAt.
  async create(dto: CreateHabitDTO): Promise<Habit> {
    // create() only builds the entity in memory; save() runs the INSERT.
    const { id } = await this.habits.save(this.habits.create(dto));
    // Re-read so nullable columns come back as null instead of missing.
    return this.findOne(id);
  }

  async update(id: number, dto: UpdateHabitDTO): Promise<Habit> {
    // preload = load the row and merge dto over it; undefined if it doesn't exist.
    const habit = await this.habits.preload({ id, ...dto });
    if (!habit) {
      throw new NotFoundException(`Habit ${id} not found`);
    }
    return this.habits.save(habit);
  }

  async delete(id: number): Promise<Habit> {
    const habit = await this.findOne(id); // 404 if the habit doesn't exist
    await this.habits.delete(id);
    return habit;
  }

  // INSERT INTO "HabitCompletion". findOne throws 404 if the habit is missing,
  // so no null check is needed here.
  async complete(habitId: number): Promise<HabitCompletion> {
    await this.findOne(habitId);
    return this.completions.save(this.completions.create({ habitId }));
  }

  // SELECT * FROM "HabitCompletion" WHERE "habitId" = ? ORDER BY "completedAt" DESC
  // Uses the "HabitCompletion_habitId_idx" index from the entity.
  async findCompletions(habitId: number): Promise<HabitCompletion[]> {
    await this.findOne(habitId); // 404 if the habit doesn't exist
    return this.completions.find({
      where: { habitId },
      order: { completedAt: 'DESC' },
    });
  }
}
