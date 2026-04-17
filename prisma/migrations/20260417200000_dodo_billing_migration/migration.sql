-- Drop obsolete RecruiterProfile columns
ALTER TABLE "RecruiterProfile" DROP COLUMN IF EXISTS "applicationAlerts";
ALTER TABLE "RecruiterProfile" DROP COLUMN IF EXISTS "emailNotifications";
ALTER TABLE "RecruiterProfile" DROP COLUMN IF EXISTS "interviewNotifications";

-- Skill.category: drop default
ALTER TABLE "Skill" ALTER COLUMN "category" DROP DEFAULT;

-- User: add new columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "digestEnabled" BOOLEAN NOT NULL DEFAULT false;

-- SubStatus enum (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubStatus') THEN
    CREATE TYPE "SubStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED');
  END IF;
END $$;

-- EarlyAccessEmail table
CREATE TABLE IF NOT EXISTS "EarlyAccessEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarlyAccessEmail_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EarlyAccessEmail_email_key" ON "EarlyAccessEmail"("email");

-- Subscription table with Dodo fields
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "dodoSubscriptionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "SubStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_dodoSubscriptionId_key" ON "Subscription"("dodoSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_dodoSubscriptionId_idx" ON "Subscription"("dodoSubscriptionId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Subscription_userId_fkey'
  ) THEN
    ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
