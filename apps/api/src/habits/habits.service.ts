import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHabitDTO } from './dto/create-habit.dto';
import { Habit } from './habit.entity';
import { HabitCompletion } from './habit-completion.entity';
import { UpdateHabitDTO } from './dto/update-habit.dto';
import { type Redis, REDIS } from '../redis/redis.client';
import { HabitFrequency } from './habit-frequency.enum';
import { isUniqueViolation } from '../common/db-errors';

// The date_trunc unit for each frequency. A habit without one counts as daily.
const PERIOD: Record<HabitFrequency, 'day' | 'week' | 'month'> = {
  [HabitFrequency.DAILY]: 'day',
  [HabitFrequency.WEEKLY]: 'week',
  [HabitFrequency.MONTHLY]: 'month',
};

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

  // Cache-aside (§5): Redis first; on a miss, the DB, then remember the result.
  async findAll(userId: number): Promise<Habit[]> {
    const key = habitsCacheKey(userId);
    // A Redis error counts as a miss. The DB is the source of truth.
    const cached = await this.redis.get(key).catch(() => null);
    if (cached) {
      // JSON has no Date type: createdAt comes back as a string (§5.3).
      return JSON.parse(cached) as Habit[];
    }

    const habits = await this.habits.find({ where: { userId } });
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
    const saved = await this.habits.save(this.habits.merge(habit, dto));
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
    const habit = await this.findOne(habitId, userId);
    const period = PERIOD[habit.frequency ?? HabitFrequency.DAILY];

    try {
      const { identifiers } = await this.completions
        .createQueryBuilder()
        .insert()
        .values({
          habitId,
          // Postgres does the time zone math: the start of the current day,
          // week or month in the user's zone. now() is the same instant the
          // completedAt default uses, because both run in one statement.
          periodStart: () =>
            `date_trunc(:period, now(), (SELECT "timezone" FROM "User" WHERE "id" = :userId))`,
        })
        .setParameters({ period, userId })
        .execute();
      // Re-read, like create(): the new row with every column filled in.
      return await this.completions.findOneByOrFail({ id: identifiers[0].id });
    } catch (err) {
      // The one error with a meaning here. Anything else goes to the filter.
      if (isUniqueViolation(err, 'HabitCompletion_habitId_periodStart_key'))
        throw new ConflictException(
          `Habit ${habitId} has already been done for this period: ${period}`,
        );
      throw err;
    }
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
