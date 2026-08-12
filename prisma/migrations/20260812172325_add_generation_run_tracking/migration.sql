-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "automation_run_id" TEXT,
ADD COLUMN     "generation_started_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Application_automation_run_id_idx" ON "Application"("automation_run_id");
