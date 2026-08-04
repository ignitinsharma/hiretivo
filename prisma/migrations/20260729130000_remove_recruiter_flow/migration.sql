-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS "Job_recruiterId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Job_recruiterId_idx";
DROP INDEX IF EXISTS "Job_isAdminPosted_idx";

-- AlterTable: Remove recruiter columns from Job
ALTER TABLE "Job" DROP COLUMN IF EXISTS "recruiterId",
DROP COLUMN IF EXISTS "isAdminPosted";

-- DropForeignKey constraints on tables being dropped
ALTER TABLE "BoostedJob" DROP CONSTRAINT IF EXISTS "BoostedJob_jobId_fkey";
ALTER TABLE "BoostedJob" DROP CONSTRAINT IF EXISTS "BoostedJob_recruiterId_fkey";
ALTER TABLE "EngineerUnlock" DROP CONSTRAINT IF EXISTS "EngineerUnlock_recruiterId_fkey";
ALTER TABLE "EngineerUnlock" DROP CONSTRAINT IF EXISTS "EngineerUnlock_engineerId_fkey";
ALTER TABLE "Interview" DROP CONSTRAINT IF EXISTS "Interview_applicationId_fkey";
ALTER TABLE "Interview" DROP CONSTRAINT IF EXISTS "Interview_recruiterId_fkey";
ALTER TABLE "Interview" DROP CONSTRAINT IF EXISTS "Interview_seekerId_fkey";
ALTER TABLE "RecruiterProfile" DROP CONSTRAINT IF EXISTS "RecruiterProfile_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "BoostedJob";
DROP TABLE IF EXISTS "EngineerUnlock";
DROP TABLE IF EXISTS "Interview";
DROP TABLE IF EXISTS "RecruiterProfile";

-- AlterEnum: Role — drop RECRUITER
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('SEEKER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'SEEKER';
DROP TYPE IF EXISTS "Role_old";

-- AlterEnum: PlanTier — add PRO, UNLIMITED; drop STARTER, GROWTH, SCALE
ALTER TABLE "User" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TYPE "PlanTier" RENAME TO "PlanTier_old";
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO', 'UNLIMITED');
ALTER TABLE "User" ALTER COLUMN "plan" TYPE "PlanTier" USING ("plan"::text::"PlanTier");
ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'FREE';
ALTER TABLE "Subscription" ALTER COLUMN "scheduledPlan" TYPE "PlanTier" USING ("scheduledPlan"::text::"PlanTier");
DROP TYPE IF EXISTS "PlanTier_old";

-- DropEnum: InterviewStatus (no longer needed)
DROP TYPE IF EXISTS "InterviewStatus";

-- AlterTable: Application add appliedAt
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "applied_at" TIMESTAMP(3);

-- AlterTable: ResumeVersion add styleConfig
ALTER TABLE "ResumeVersion" ADD COLUMN IF NOT EXISTS "styleConfig" JSONB;
