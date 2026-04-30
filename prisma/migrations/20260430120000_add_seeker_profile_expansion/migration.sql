-- Add social URL columns to SeekerProfile
ALTER TABLE "SeekerProfile" ADD COLUMN "websiteUrl" TEXT;
ALTER TABLE "SeekerProfile" ADD COLUMN "linkedinUrl" TEXT;
ALTER TABLE "SeekerProfile" ADD COLUMN "githubUrl" TEXT;
ALTER TABLE "SeekerProfile" ADD COLUMN "twitterUrl" TEXT;

-- Create WorkExperience table
CREATE TABLE "WorkExperience" (
    "id" TEXT NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "positionType" TEXT,
    "skills" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkExperience_pkey" PRIMARY KEY ("id")
);

-- Create Education table
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "graduationDate" TEXT,
    "degree" TEXT,
    "major" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "WorkExperience_seekerProfileId_idx" ON "WorkExperience"("seekerProfileId");
CREATE INDEX "Education_seekerProfileId_idx" ON "Education"("seekerProfileId");

-- Add foreign keys
ALTER TABLE "WorkExperience" ADD CONSTRAINT "WorkExperience_seekerProfileId_fkey" FOREIGN KEY ("seekerProfileId") REFERENCES "SeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Education" ADD CONSTRAINT "Education_seekerProfileId_fkey" FOREIGN KEY ("seekerProfileId") REFERENCES "SeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
