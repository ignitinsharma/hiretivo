-- Add lastDigestSentAt to User model for weekly digest idempotency
ALTER TABLE "User" ADD COLUMN "lastDigestSentAt" TIMESTAMP;