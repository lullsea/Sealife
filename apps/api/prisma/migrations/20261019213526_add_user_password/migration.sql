/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- 1. Add the column as optional first
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- 2. Update existing rows with a placeholder value
UPDATE "User" SET "password" = 'fallback_secure_password_here' WHERE "password" IS NULL;

-- 3. Make the column required now that it's populated
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
