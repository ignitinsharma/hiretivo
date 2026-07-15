-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "activeVersionId" TEXT,
ADD COLUMN     "generationCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MasterResume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterResume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GenerationQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "resumeJson" JSONB NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'ai-generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterResume_userId_key" ON "MasterResume"("userId");

-- CreateIndex
CREATE INDEX "MasterResume_userId_idx" ON "MasterResume"("userId");

-- CreateIndex
CREATE INDEX "GenerationQuota_userId_idx" ON "GenerationQuota"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationQuota_userId_month_key" ON "GenerationQuota"("userId", "month");

-- CreateIndex
CREATE INDEX "ResumeVersion_applicationId_idx" ON "ResumeVersion"("applicationId");

-- CreateIndex
CREATE INDEX "CoverLetter_applicationId_idx" ON "CoverLetter"("applicationId");

-- CreateIndex
CREATE INDEX "Application_activeVersionId_idx" ON "Application"("activeVersionId");

-- AddForeignKey
ALTER TABLE "MasterResume" ADD CONSTRAINT "MasterResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationQuota" ADD CONSTRAINT "GenerationQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
