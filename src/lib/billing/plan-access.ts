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
 * UnlockQuotaConfig
 * Describes how a plan's unlock quota is enforced.
 * FREE: 3 lifetime trial unlocks (source='trial', no billing period filter).
 * Paid: per-billing-period quota (source='talent_pool').
 * SCALE: unlimited (limit null).
 */
export type UnlockQuotaConfig = {
  limit: number | null;
  period: "lifetime" | "billing";
  source: "trial" | "talent_pool";
};

/*
 * getUnlockQuotaConfig
 * Returns quota config for a given plan.
 * FREE: 3 lifetime trial unlocks. Paid: per-period quotas. SCALE: unlimited.
 */
export function getUnlockQuotaConfig(plan: string | null | undefined): UnlockQuotaConfig {
  switch (plan) {
    case PlanTier.FREE:    return { limit: 3,    period: "lifetime", source: "trial" };
    case PlanTier.STARTER: return { limit: 10,   period: "billing",  source: "talent_pool" };
    case PlanTier.GROWTH:  return { limit: 30,   period: "billing",  source: "talent_pool" };
    case PlanTier.SCALE:   return { limit: null, period: "billing",  source: "talent_pool" };
    default:               return { limit: 0,    period: "billing",  source: "talent_pool" };
  }
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
