-- Add digestEnabled to SeekerProfile for weekly digest opt-in
ALTER TABLE "SeekerProfile" ADD COLUMN "digestEnabled" BOOLEAN NOT NULL DEFAULT false;
