-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "externalCompanyName" TEXT,
ADD COLUMN     "externalDescription" TEXT,
ADD COLUMN     "externalSkills" JSONB,
ADD COLUMN     "externalTitle" TEXT;
