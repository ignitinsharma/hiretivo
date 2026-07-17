-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('NOT_APPLIED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "pipeline_stage" "PipelineStage" NOT NULL DEFAULT 'NOT_APPLIED';

-- Backfill: existing applications where automation_status = 'SUBMITTED' → APPLIED
UPDATE "Application" SET "pipeline_stage" = 'APPLIED' WHERE "automation_status" = 'SUBMITTED';

-- CreateIndex
CREATE INDEX "Application_pipeline_stage_idx" ON "Application"("pipeline_stage");
