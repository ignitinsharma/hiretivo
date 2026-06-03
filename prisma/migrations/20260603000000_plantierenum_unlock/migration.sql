-- Migration: replace PlanTier FREE/PRO/ENTERPRISE with FREE/STARTER/GROWTH/SCALE
-- and create EngineerUnlock table.
-- Safety net: downgrade any existing PRO/ENTERPRISE rows to FREE before enum change.

UPDATE "User" SET "plan" = 'FREE' WHERE "plan" IN ('PRO', 'ENTERPRISE');

-- Rename old enum out of the way
ALTER TYPE "PlanTier" RENAME TO "PlanTier_old";

-- Create new enum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'SCALE');

-- Migrate column to new type
ALTER TABLE "User"
  ALTER COLUMN "plan" TYPE "PlanTier"
  USING ("plan"::text::"PlanTier");

ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'FREE';

-- Drop old enum
DROP TYPE "PlanTier_old";

-- CreateTable EngineerUnlock
CREATE TABLE "EngineerUnlock" (
    "id"          TEXT         NOT NULL,
    "recruiterId" TEXT         NOT NULL,
    "engineerId"  TEXT         NOT NULL,
    "source"      TEXT         NOT NULL DEFAULT 'talent_pool',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineerUnlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EngineerUnlock_recruiterId_engineerId_key"
    ON "EngineerUnlock"("recruiterId", "engineerId");

CREATE INDEX "EngineerUnlock_recruiterId_idx"  ON "EngineerUnlock"("recruiterId");
CREATE INDEX "EngineerUnlock_engineerId_idx"   ON "EngineerUnlock"("engineerId");
CREATE INDEX "EngineerUnlock_source_idx"       ON "EngineerUnlock"("source");
CREATE INDEX "EngineerUnlock_createdAt_idx"    ON "EngineerUnlock"("createdAt");

ALTER TABLE "EngineerUnlock"
    ADD CONSTRAINT "EngineerUnlock_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EngineerUnlock"
    ADD CONSTRAINT "EngineerUnlock_engineerId_fkey"
    FOREIGN KEY ("engineerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
