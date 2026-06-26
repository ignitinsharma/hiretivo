-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "description_hash" TEXT;

-- CreateIndex
CREATE INDEX "Job_companyName_status_idx" ON "Job"("companyName", "status");
