-- Add scheduled plan change tracking to Subscription model
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "scheduledPlan" "PlanTier";
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "scheduledChangeAt" TIMESTAMP(3);
