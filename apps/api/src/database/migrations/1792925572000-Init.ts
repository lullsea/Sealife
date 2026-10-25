import type { MigrationInterface, QueryRunner } from 'typeorm';

// Baseline schema, identical to what the old Prisma migrations produced.
// Every statement is idempotent: on a fresh database it creates everything,
// on a database Prisma already migrated it only normalizes the timestamp
// defaults (see the end of up()) and is recorded as run.
export class Init1792925572000 implements MigrationInterface {
  name = 'Init1792925572000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" SERIAL NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
        "password" TEXT NOT NULL,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Habit" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
        "archived" BOOLEAN NOT NULL DEFAULT false,
        "frequency" "HabitFrequency",
        "userId" INTEGER NOT NULL,
        CONSTRAINT "Habit_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "Habit_userId_idx" ON "Habit"("userId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "HabitCompletion" (
        "id" SERIAL NOT NULL,
        "completedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
        "habitId" INTEGER NOT NULL,
        CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "HabitCompletion_habitId_fkey" FOREIGN KEY ("habitId")
          REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "HabitCompletion_habitId_idx" ON "HabitCompletion"("habitId")`,
    );

    // Prisma wrote these defaults as CURRENT_TIMESTAMP. Same function in
    // Postgres, but TypeORM expects now(), so align them to avoid a diff.
    await queryRunner.query(
      `ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "Habit" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "HabitCompletion" ALTER COLUMN "completedAt" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "HabitCompletion"`);
    await queryRunner.query(`DROP TABLE "Habit"`);
    await queryRunner.query(`DROP TABLE "User"`);
    await queryRunner.query(`DROP TYPE "HabitFrequency"`);
  }
}
