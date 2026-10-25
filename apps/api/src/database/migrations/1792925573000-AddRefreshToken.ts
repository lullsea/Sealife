import type { MigrationInterface, QueryRunner } from 'typeorm';

// Same schema as the Prisma migration 20261020213804_add_refresh_token,
// which was written on a parallel branch. Idempotent like Init: on a database
// that already ran the Prisma migration it only normalizes the default.
export class AddRefreshToken1792925573000 implements MigrationInterface {
  name = 'AddRefreshToken1792925573000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "RefreshToken" (
        "id" SERIAL NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "userId" INTEGER NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "revokedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
        CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId")`,
    );

    // Prisma wrote CURRENT_TIMESTAMP; align to now() as Init does.
    await queryRunner.query(
      `ALTER TABLE "RefreshToken" ALTER COLUMN "createdAt" SET DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "RefreshToken"`);
  }
}
