ALTER TABLE "Application" ADD COLUMN "furthest_pipeline_stage" "PipelineStage" NOT NULL DEFAULT 'NOT_APPLIED';

UPDATE "Application"
SET "furthest_pipeline_stage" = CASE
  WHEN "pipeline_stage" = 'REJECTED' THEN 'APPLIED'::"PipelineStage"
  ELSE "pipeline_stage"
END;
