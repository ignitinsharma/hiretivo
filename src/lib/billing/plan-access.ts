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
 * canPostJob
 * Returns true when the plan allows posting another job.
 * FREE: never. STARTER: up to 2 active jobs. GROWTH/SCALE: unlimited.
 */
export function canPostJob(plan: PlanTier | string | null | undefined, currentOpenJobCount: number): boolean {
  if (plan === PlanTier.FREE) return false;
  if (plan === PlanTier.STARTER) return currentOpenJobCount < 2;
  return true; // GROWTH, SCALE
}

export const TALENT_POOL_UPGRADE_COPY = {
  title: "Unlock Verified Engineers",
  description: "Starter plan unlocks 10 engineers/mo — $199/mo",
  cta: "Upgrade to Starter →",
} as const;
