import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHabitDTO } from './dto/create-habit.dto';
import { Habit } from './habit.entity';
import { HabitCompletion } from './habit-completion.entity';
import { UpdateHabitDTO } from './dto/update-habit.dto';
import { type Redis, REDIS } from '../redis/redis.client';

const HABITS_CACHE_TTL_SECONDS = 60;
const habitsCacheKey = (id: number): string => `cache:habits:${id}`;

// Business logic lives here. No HTTP concepts (requests, status codes, routes).
// @Injectable() lets Nest create this class and inject it into others.
@Injectable()
export class HabitsService {
  // Nest injects the repositories registered by TypeOrmModule.forFeature in HabitsModule.
  constructor(
    @InjectRepository(Habit) private readonly habits: Repository<Habit>,
    @InjectRepository(HabitCompletion)
    private readonly completions: Repository<HabitCompletion>,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  // SELECT * FROM "Habit"
  async findAll(userId: number): Promise<Habit[]> {
    const key = habitsCacheKey(userId);
    // Check redis cache for existing records
    const cached = await this.redis.get(key).catch(() => null);
    // If the users habits has already been cached just return it
    if (cached) return JSON.parse(cached) as Habit[];

    // Fetch all habits of the user
    const habits = this.habits.find({ where: { userId } });
    // Save the users habits in cache, indexed by the key
    await this.redis
      .set(key, JSON.stringify(habits), {
        expiration: { type: 'EX', value: HABITS_CACHE_TTL_SECONDS },
      })
      .catch(() => {});
    return habits;
  }

  // Invalidate a users habit records in cache
  private async invalidate(userId: number): Promise<void> {
    await this.redis.del(habitsCacheKey(userId)).catch(() => null);
  }

  async findOne(id: number, userId: number): Promise<Habit> {
    // findOneBy resolves to null (not an error) when no row matches.
    const habit = await this.habits.findOneBy({ id, userId });
    if (!habit) {
      // Nest turns this into a 404 response automatically.
      throw new NotFoundException(`Habit ${id} not found`);
    }
    return habit;
  }
  // INSERT INTO "Habit". The DB assigns id and createdAt.
  async create(userId: number, dto: CreateHabitDTO): Promise<Habit> {
    // create() only builds the entity in memory; save() runs the INSERT.
    const { id } = await this.habits.save(
      this.habits.create({ ...dto, userId }),
    );
    await this.invalidate(userId);
    // Re-read so nullable columns come back as null instead of missing.
    return this.findOne(id, userId);
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateHabitDTO,
  ): Promise<Habit> {
    const habit = await this.findOne(id, userId); // 404 if missing or not yours
    const saved = this.habits.save(this.habits.merge(habit, dto));
    await this.invalidate(userId);
    return saved;
  }

  async delete(id: number, userId: number): Promise<Habit> {
    const habit = await this.findOne(id, userId); // 404 if the habit doesn't exist
    await this.habits.delete(id);
    await this.invalidate(userId);
    return habit;
  }

  // INSERT INTO "HabitCompletion". findOne throws 404 if the habit is missing,
  // so no null check is needed here.
  async complete(habitId: number, userId: number): Promise<HabitCompletion> {
    await this.findOne(habitId, userId);
    return this.completions.save(this.completions.create({ habitId }));
  }

  // SELECT * FROM "HabitCompletion" WHERE "habitId" = ? ORDER BY "completedAt" DESC
  // Uses the "HabitCompletion_habitId_idx" index from the entity.
  async findCompletions(
    habitId: number,
    userId: number,
  ): Promise<HabitCompletion[]> {
    await this.findOne(habitId, userId); // 404 if the habit doesn't exist
    return this.completions.find({
      where: { habitId },
      order: { completedAt: 'DESC' },
    });
  }
}
