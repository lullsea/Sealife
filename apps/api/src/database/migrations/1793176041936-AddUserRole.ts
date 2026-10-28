import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRole1793176041936 implements MigrationInterface {
    name = 'AddUserRole1793176041936'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."UserRole" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`ALTER TABLE "User" ADD "role" "public"."UserRole" NOT NULL DEFAULT 'USER'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."UserRole"`);
    }

}
