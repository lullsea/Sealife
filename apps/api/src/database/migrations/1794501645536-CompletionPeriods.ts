import type { MigrationInterface, QueryRunner } from 'typeorm';

// One completion per habit per period (completions.md). Generated, then
// edited: the generated version added periodStart as NOT NULL in one step,
// which fails as soon as the table has rows. The order that works is
// add it nullable -> fill it in -> forbid NULL -> add the unique index.
export class CompletionPeriods1794080063189 implements MigrationInterface {
  name = 'CompletionPeriods1794080063189';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "User" ADD "timezone" text NOT NULL DEFAULT 'UTC'`,
    );
    await queryRunner.query(
      `ALTER TABLE "HabitCompletion" ADD "periodStart" TIMESTAMP(3) WITH TIME ZONE`,
    );
    // The period each existing completion falls in, by the same rule as
    // HabitsService.complete. Every user's zone is still the 'UTC' default.
    await queryRunner.query(`
      UPDATE "HabitCompletion" c
      SET "periodStart" = date_trunc(
        CASE h."frequency" WHEN 'WEEKLY' THEN 'week' WHEN 'MONTHLY' THEN 'month' ELSE 'day' END,
        c."completedAt",
        u."timezone"
      )
      FROM "Habit" h
      JOIN "User" u ON u."id" = h."userId"
      WHERE h."id" = c."habitId"
    `);
    await queryRunner.query(
      `ALTER TABLE "HabitCompletion" ALTER COLUMN "periodStart" SET NOT NULL`,
    );
    // Fails if two existing completions share a period (completions.md §4.4).
    // The migration runs in a transaction, so then nothing above is kept.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "HabitCompletion_habitId_periodStart_key" ON "HabitCompletion" ("habitId", "periodStart")`,
    );
    // The unique index starts with habitId, so it covers these lookups now.
    await queryRunner.query(
      `DROP INDEX "public"."HabitCompletion_habitId_idx"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "HabitCompletion_habitId_idx" ON "HabitCompletion" ("habitId")`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."HabitCompletion_habitId_periodStart_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "HabitCompletion" DROP COLUMN "periodStart"`,
    );
    await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "timezone"`);
  }
}
