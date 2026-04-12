ALTER TABLE "RecruiterProfile"
  ADD COLUMN IF NOT EXISTS "emailNotifications"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "applicationAlerts"       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "interviewNotifications"  BOOLEAN NOT NULL DEFAULT true;
