-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('NOT_APPLIED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "pipeline_stage" "PipelineStage" NOT NULL DEFAULT 'NOT_APPLIED';

-- CreateIndex
CREATE INDEX "Application_pipeline_stage_idx" ON "Application"("pipeline_stage");
