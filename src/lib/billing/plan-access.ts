import { PlanTier } from "@/constants/enums";

/*
 * canAccessTalentPool
 * Returns true when the plan tier allows talent pool browse and unlock.
 * FREE plan has no access. STARTER/GROWTH/SCALE all have access.
 */
export function canAccessTalentPool(plan: PlanTier | string | null | undefined): boolean {
  return plan === PlanTier.STARTER || plan === PlanTier.GROWTH || plan === PlanTier.SCALE;
}

/*
 * getUnlockQuota
 * Returns monthly unlock quota for the plan. null = unlimited (SCALE).
 * FREE = 0, STARTER = 10, GROWTH = 30, SCALE = null.
 */
export function getUnlockQuota(plan: PlanTier | string | null | undefined): number | null {
  const quotas: Record<string, number | null> = {
    FREE: 0,
    STARTER: 10,
    GROWTH: 30,
    SCALE: null,
  };
  return quotas[plan as string] ?? 0;
}

/*
 * getJobPostingLimit
 * Returns the max number of OPEN jobs allowed for a plan tier.
 * Returns null for unlimited (GROWTH, SCALE, ENTERPRISE).
 * FREE = 0 (cannot post), STARTER = 2, PRO = 10 (legacy), others null.
 */
export function getJobPostingLimit(plan: string | null | undefined): number | null {
  switch (plan) {
    case PlanTier.FREE:    return 0;
    case PlanTier.STARTER: return 2;
    case PlanTier.GROWTH:  return null;   // unlimited
    case PlanTier.SCALE:   return null;   // unlimited
    case "PRO":            return 10;     // legacy — old plan tier
    case "ENTERPRISE":     return null;   // legacy — old plan tier
    default:               return 0;      // unknown = treat as FREE
  }
}

/*
 * canPostJob
 * Returns true when the plan allows posting another job.
 * FREE: never. STARTER: up to 2 active jobs. GROWTH/SCALE: unlimited.
 */
export function canPostJob(plan: PlanTier | string | null | undefined, currentOpenJobCount: number): boolean {
  const limit = getJobPostingLimit(plan);
  if (limit === null) return true;  // unlimited
  return currentOpenJobCount < limit;
}

/*
 * canAccessRecruiterPaidFeature
 * Returns true when the plan tier is a paid tier eligible for premium features.
 * FREE is not paid; all other tiers are.
 */
export function canAccessRecruiterPaidFeature(plan: string | null | undefined): boolean {
  return (
    plan === PlanTier.STARTER ||
    plan === PlanTier.GROWTH ||
    plan === PlanTier.SCALE ||
    plan === "PRO" ||        // legacy
    plan === "ENTERPRISE"    // legacy
  );
}

export const TALENT_POOL_UPGRADE_COPY = {
  title: "Unlock Verified Engineers",
  description: "Starter plan unlocks 10 engineers/mo — $199/mo",
  cta: "Upgrade to Starter →",
} as const;
