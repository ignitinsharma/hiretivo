-- Catch-up migration: columns added via `prisma db push` but never captured
-- in migration files. Uses IF NOT EXISTS so it is safe to re-run.

-- SeekerProfile ---------------------------------------------------------------
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "resumeKey" TEXT;

-- Skill (category is required — default covers any existing rows) -------------
ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Other';

-- Job -------------------------------------------------------------------------
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- RecruiterProfile notification prefs (was in a loose .sql, not a real migration)
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "applicationAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "interviewNotifications" BOOLEAN NOT NULL DEFAULT true;
