-- Missing RecruiterProfile columns added in bab2b5e but absent from migration history
-- Using IF NOT EXISTS to be safe against databases that already received these via db push
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "fundingType" TEXT;
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "isFullyRemote" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "logo" TEXT;
