-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Job_ownerId_idx" ON "Job"("ownerId");
