-- CreateEnum
CREATE TYPE "WorkAuthStatus" AS ENUM ('CITIZEN', 'PERMANENT_RESIDENT', 'WORK_VISA', 'NEEDS_SPONSORSHIP', 'STUDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SelfIdGender" AS ENUM ('MALE', 'FEMALE', 'NONBINARY', 'PREFER_NOT');

-- CreateEnum
CREATE TYPE "SelfIdAnswer" AS ENUM ('YES', 'NO', 'PREFER_NOT');

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issueDate" TEXT,
    "expiryDate" TEXT,
    "credentialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDefaults" (
    "id" TEXT NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "addressLine" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "countryCode" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "workAuth" "WorkAuthStatus",
    "authorizedCountry" TEXT,
    "needsSponsorship" BOOLEAN,
    "openToOnsite" BOOLEAN,
    "willingRelocate" BOOLEAN,
    "startImmediately" BOOLEAN,
    "selfIdGender" "SelfIdGender",
    "selfIdEthnicity" TEXT,
    "veteranStatus" "SelfIdAnswer",
    "disabilityStatus" "SelfIdAnswer",
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationDefaults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Certification_seekerProfileId_idx" ON "Certification"("seekerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationDefaults_seekerProfileId_key" ON "ApplicationDefaults"("seekerProfileId");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_seekerProfileId_fkey" FOREIGN KEY ("seekerProfileId") REFERENCES "SeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDefaults" ADD CONSTRAINT "ApplicationDefaults_seekerProfileId_fkey" FOREIGN KEY ("seekerProfileId") REFERENCES "SeekerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
