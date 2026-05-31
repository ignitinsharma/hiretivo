import { PlanTier } from "@/constants/enums";

export function isRecruiterTrialActive(): boolean {
  const end = process.env.RECRUITER_TRIAL_ENDS;
  if (!end) return false;
  return new Date() < new Date(end);
}

/*
 * Returns max active OPEN jobs for the given plan per PIVOT.md §5.
 * null = unlimited. 0 = hard block (FREE).
 * Trial period (RECRUITER_TRIAL_ENDS env) bumps FREE to 2 to allow testing.
 */
export function getRecruiterJobLimit(
  plan: PlanTier | string | null | undefined,
): number | null {
  if (plan === PlanTier.GROWTH || plan === PlanTier.SCALE) return null;
  if (plan === PlanTier.STARTER) return 2;
  if (isRecruiterTrialActive()) return 2;
  return 0;
}
