-- AlterTable: Add ATS fields to Job
ALTER TABLE "Job" ADD COLUMN "atsSource" TEXT;
ALTER TABLE "Job" ADD COLUMN "atsSourceId" TEXT;
ALTER TABLE "Job" ADD COLUMN "dedupeKey" TEXT;
ALTER TABLE "Job" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN "location" TEXT;
ALTER TABLE "Job" ADD COLUMN "locationClass" TEXT;
ALTER TABLE "Job" ADD COLUMN "visaSponsored" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: Unique constraint on dedupeKey
CREATE UNIQUE INDEX "Job_dedupeKey_key" ON "Job"("dedupeKey");

-- CreateIndex: Indexes for ATS query performance
CREATE INDEX "Job_atsSource_idx" ON "Job"("atsSource");
CREATE INDEX "Job_locationClass_idx" ON "Job"("locationClass");
CREATE INDEX "Job_lastSeenAt_idx" ON "Job"("lastSeenAt");

-- CreateTable: AtsBlocklist
CREATE TABLE "AtsBlocklist" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "domain" TEXT,
    "reason" TEXT,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedBy" TEXT,

    CONSTRAINT "AtsBlocklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: AtsBlocklist indexes
CREATE INDEX "AtsBlocklist_companyName_idx" ON "AtsBlocklist"("companyName");
CREATE INDEX "AtsBlocklist_domain_idx" ON "AtsBlocklist"("domain");
