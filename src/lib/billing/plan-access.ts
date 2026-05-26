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
export function canPostJob(
  plan: PlanTier | string | null | undefined,
  currentOpenJobCount: number,
): boolean {
  if (plan === PlanTier.FREE) return false;
  if (plan === PlanTier.STARTER) return currentOpenJobCount < 2;
  return true; // GROWTH, SCALE
}

/*
 * canAccessRecruiterPaidFeature
 * Returns true when the plan is any paid tier (STARTER, GROWTH, SCALE).
 * Used by legacy feature-gate callers. FREE plan returns false.
 */
export function canAccessRecruiterPaidFeature(plan: string | null | undefined): boolean {
  return plan !== PlanTier.FREE && plan != null;
}

export const TALENT_POOL_UPGRADE_COPY = {
  title: "Unlock Verified Engineers",
  description: "Starter plan unlocks 10 engineers/mo — $199/mo",
  cta: "Upgrade to Starter →",
} as const;

/*
 * RecruiterPaidFeature
 * Union type for the named paid feature gates shown in the upgrade modal.
 * Preserved here (instead of enums.ts) so existing store/UI importers compile.
 */
export type RecruiterPaidFeature =
  | "talent_pool"
  | "interview_scheduling"
  | "ai_candidate_summaries";

/*
 * PAID_FEATURE_COPY
 * Copy strings used by the upgrade modal for each paid feature gate.
 */
export const PAID_FEATURE_COPY: Record<
  RecruiterPaidFeature,
  { title: string; description: string }
> = {
  talent_pool: {
    title: "Unlock the Talent Pool",
    description:
      "Search verified candidates by skills, role, location, and availability. Available on Starter and above.",
  },
  interview_scheduling: {
    title: "Schedule Interviews from Hiretivo",
    description:
      "Send interview invites and email candidates directly. Available on Starter and above.",
  },
  ai_candidate_summaries: {
    title: "AI Candidate Summaries",
    description:
      "Get instant AI-powered insights on every candidate. Available on Starter and above.",
  },
};

export const PAID_FEATURE_FORBIDDEN_MESSAGE =
  "This feature requires a paid plan. Upgrade to Starter or above to continue.";

export const PAID_FEATURES_BENEFITS = [
  { icon: "users", text: "Search verified candidates by skills & role" },
  { icon: "calendar", text: "Schedule interviews directly" },
  { icon: "sparkles", text: "AI candidate summaries & insights" },
  { icon: "mail", text: "Email candidates directly" },
  { icon: "zap", text: "Cancel anytime, no contracts" },
];
