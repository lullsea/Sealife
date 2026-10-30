import type { MigrationInterface, QueryRunner } from 'typeorm';

// timestamp -> timestamptz (next-steps.md §4.1). A plain timestamp stores
// wall-clock time with no zone, and two writers filled these columns in
// different zones:
//   - DB defaults (now()) ran in the server zone, Etc/UTC.
//   - new Date() from Node was sent by pg in the machine zone, Asia/Kuala_Lumpur.
// USING ... AT TIME ZONE tells Postgres which zone each column's existing
// values are in, so they become the exact moment they were meant to be.
// Rows written from a machine in any other zone can't be recovered this way.
const COLUMNS: [table: string, column: string, writtenIn: string][] = [
  ['User', 'createdAt', 'UTC'],
  ['Habit', 'createdAt', 'UTC'],
  ['HabitCompletion', 'completedAt', 'UTC'],
  ['RefreshToken', 'createdAt', 'UTC'],
  ['RefreshToken', 'expiresAt', 'Asia/Kuala_Lumpur'],
  ['RefreshToken', 'revokedAt', 'Asia/Kuala_Lumpur'],
];

export class TimestampsWithTimeZone1793332290136 implements MigrationInterface {
  name = 'TimestampsWithTimeZone1793332290136';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column, writtenIn] of COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMP(3) WITH TIME ZONE USING "${column}" AT TIME ZONE '${writtenIn}'`,
      );
    }
  }

  // Back to wall-clock time in the zone each column was written in, so the
  // old code reads the same values it did before.
  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, column, writtenIn] of COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMP(3) USING "${column}" AT TIME ZONE '${writtenIn}'`,
      );
    }
  }
}
