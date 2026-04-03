-- Remaining columns that were pushed via db push but not in migration history
ALTER TABLE "RecruiterProfile" ADD COLUMN IF NOT EXISTS "companySize" TEXT;
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "primaryRole" TEXT;
