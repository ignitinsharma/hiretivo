-- Add AutomationStatus enum and automation_status column to Application
CREATE TYPE "AutomationStatus" AS ENUM ('GENERATING', 'READY', 'APPLYING', 'SUBMITTED', 'NEEDS_YOU', 'FAILED', 'COMPLETED', 'SKIPPED');

ALTER TABLE "Application" ADD COLUMN "automation_status" "AutomationStatus";
