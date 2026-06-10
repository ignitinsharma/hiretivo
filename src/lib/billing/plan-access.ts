import { PlanTier } from "@/constants/enums";

/*
 * canAccessTalentPool
 * Returns true for all paid plans (STARTER/GROWTH/SCALE).
 * FREE recruiters see blurred demo cards only.
 */
export function canAccessTalentPool(plan: string | null | undefined): boolean {
  return (
    plan === PlanTier.STARTER ||
    plan === PlanTier.GROWTH ||
    plan === PlanTier.SCALE
  );
}

/*
 * getUnlockQuota
 * Returns max talent_pool unlocks per billing period.
 * null = unlimited (SCALE). 0 = FREE (no unlocks).
 */
export function getUnlockQuota(plan: string | null | undefined): number | null {
  if (plan === PlanTier.STARTER) return 10;
  if (plan === PlanTier.GROWTH) return 30;
  if (plan === PlanTier.SCALE) return null;
  return 0;
}

/*
 * canPostJob
 * Returns true when this plan can post another active job given the current count.
 * STARTER=2 active jobs, GROWTH/SCALE=unlimited, FREE=0.
 */
export function canPostJob(
  plan: string | null | undefined,
  currentActiveJobCount: number,
): boolean {
  if (plan === PlanTier.STARTER) return currentActiveJobCount < 2;
  if (plan === PlanTier.GROWTH || plan === PlanTier.SCALE) return true;
  return currentActiveJobCount < 1; // FREE: 1 active job
}

/*
 * getJobLimit
 * Returns the max active jobs allowed for the plan. null = unlimited.
 */
export function getJobLimit(plan: string | null | undefined): number | null {
  if (plan === PlanTier.STARTER) return 2;
  if (plan === PlanTier.GROWTH || plan === PlanTier.SCALE) return null;
  return 1; // FREE: 1 active job
}

export const TALENT_POOL_UPGRADE_COPY = {
  title: "Unlock the Verified Talent Pool",
  description:
    "Browse 1,000+ verified Indian engineers. Unlock profiles to reveal full contact details. Starting at $199/mo.",
};
