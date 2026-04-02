-- AlterTable: Add wizard fields to SeekerProfile
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "situation" TEXT;
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "salaryMin" INTEGER;
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "salaryMax" INTEGER;
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "currency" TEXT;
ALTER TABLE "SeekerProfile" ADD COLUMN IF NOT EXISTS "availability" TEXT;

-- primaryRole already exists in DB (added outside migration history)
-- companySize already exists in DB (added outside migration history)
