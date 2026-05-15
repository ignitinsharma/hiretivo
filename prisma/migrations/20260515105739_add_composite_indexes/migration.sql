-- Composite indexes for hot multi-filter queries.
-- Job feed sorts by status=OPEN ORDER BY createdAt DESC.
-- Application funnel filters by jobId + status together.
-- IF NOT EXISTS lets re-runs be idempotent in case a branch already added these.

CREATE INDEX IF NOT EXISTS "Job_status_createdAt_idx" ON "Job"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Application_jobId_status_idx" ON "Application"("jobId", "status");
