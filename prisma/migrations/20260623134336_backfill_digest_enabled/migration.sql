-- Backfill: opt all existing seekers into weekly digest
UPDATE "SeekerProfile" SET "digestEnabled" = true WHERE "digestEnabled" = false;