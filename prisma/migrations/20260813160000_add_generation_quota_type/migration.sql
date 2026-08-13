-- AlterTable
ALTER TABLE "GenerationQuota" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'RESUME';

-- DropIndex (replaced by composite unique including type)
DROP INDEX "GenerationQuota_userId_month_key";

-- CreateIndex
CREATE UNIQUE INDEX "GenerationQuota_userId_month_type_key" ON "GenerationQuota"("userId", "month", "type");