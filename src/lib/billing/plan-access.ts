import { PlanTier } from "@/constants/enums";

/*
 * Returns true if the recruiter plan allows access to the talent pool browse.
 * FREE plan sees blurred cards only — must upgrade to unlock engineers.
 */
export function canAccessTalentPool(plan: string | null | undefined): boolean {
  return (
    plan === PlanTier.STARTER ||
    plan === PlanTier.GROWTH ||
    plan === PlanTier.SCALE
  );
}

/*
 * Returns the monthly unlock quota for a plan.
 * null = unlimited (SCALE).
 * 0 = no unlocks (FREE — hard block).
 */
export function getUnlockQuota(plan: string | null | undefined): number | null {
  if (plan === PlanTier.STARTER) return 10;
  if (plan === PlanTier.GROWTH) return 30;
  if (plan === PlanTier.SCALE) return null;
  return 0;
}

/*
 * Returns the max active job posts allowed for a plan.
 * null = unlimited.
 * 0 = cannot post jobs (FREE — hard block, must upgrade).
 */
export function getActiveJobLimit(plan: string | null | undefined): number | null {
  if (plan === PlanTier.STARTER) return 2;
  if (plan === PlanTier.GROWTH || plan === PlanTier.SCALE) return null;
  return 0;
}

/*
 * Returns true for any paid plan (STARTER, GROWTH, or SCALE).
 * Used for feature gates that require any active subscription.
 */
export function isPaidPlan(plan: string | null | undefined): boolean {
  return (
    plan === PlanTier.STARTER ||
    plan === PlanTier.GROWTH ||
    plan === PlanTier.SCALE
  );
}

/*
 * Display name for a plan tier in UI copy.
 */
export function getPlanDisplayName(plan: string | null | undefined): string {
  if (plan === PlanTier.STARTER) return "Starter";
  if (plan === PlanTier.GROWTH) return "Growth";
  if (plan === PlanTier.SCALE) return "Scale";
  return "Free";
}

export const PAID_FEATURE_FORBIDDEN_MESSAGE =
  "This feature requires a Starter, Growth, or Scale plan. Upgrade to continue.";
