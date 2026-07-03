/*
  Warnings:

  - A unique constraint covering the columns `[seekerId,externalJobUrl]` on the table `Application` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ApplySource" AS ENUM ('FEED', 'PASTED_LINK');

-- AlterEnum
ALTER TYPE "AppStatus" ADD VALUE 'GHOSTED';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "externalJobUrl" TEXT,
ADD COLUMN     "keywordStats" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "source" "ApplySource" NOT NULL DEFAULT 'FEED',
ADD COLUMN     "statusLog" JSONB,
ADD COLUMN     "submittedFormData" JSONB,
ADD COLUMN     "tailoredResumeKey" TEXT,
ALTER COLUMN "jobId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Application_seekerId_externalJobUrl_key" ON "Application"("seekerId", "externalJobUrl");
