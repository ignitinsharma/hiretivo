-- Phase 4: Canonical application pipeline migration
-- Maps legacy statuses to the required six-stage pipeline while preserving all Application rows.

BEGIN;

CREATE TYPE "AppStatus_new" AS ENUM (
  'APPLIED',
  'REVIEWING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED'
);

ALTER TABLE "Application"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Application"
  ALTER COLUMN "status" TYPE "AppStatus_new"
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'APPLIED'
      WHEN 'REVIEWED' THEN 'REVIEWING'
      WHEN 'SHORTLISTED' THEN 'INTERVIEW'
      WHEN 'WITHDRAWN' THEN 'REJECTED'
      WHEN 'REJECTED' THEN 'REJECTED'
      ELSE 'APPLIED'
    END
  )::"AppStatus_new";

DROP TYPE "AppStatus";
ALTER TYPE "AppStatus_new" RENAME TO "AppStatus";

ALTER TABLE "Application"
  ALTER COLUMN "status" SET DEFAULT 'APPLIED';

COMMIT;

