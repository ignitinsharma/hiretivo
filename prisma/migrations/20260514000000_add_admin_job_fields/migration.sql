-- AlterTable: Add admin company override fields to Job
ALTER TABLE "Job"
ADD COLUMN "companyName"     TEXT,
ADD COLUMN "companyLogoUrl"  TEXT,
ADD COLUMN "companyWebsite"  TEXT,
ADD COLUMN "companySize"     TEXT,
ADD COLUMN "companyIndustry" TEXT,
ADD COLUMN "companyFunding"  TEXT,
ADD COLUMN "isAdminPosted"   BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Job_isAdminPosted_idx" ON "Job"("isAdminPosted");
