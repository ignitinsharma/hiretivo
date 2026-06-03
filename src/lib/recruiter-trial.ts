import { PlanTier } from "@/constants/enums";

export function isRecruiterTrialActive(): boolean {
  const end = process.env.RECRUITER_TRIAL_ENDS;
  if (!end) return false;
  return new Date() < new Date(end);
}

/*
 * getRecruiterJobLimit
 * Returns max active job posts for the plan, or null for unlimited.
 * Trial override (env-flag) grants 4 posts to any FREE recruiter during the launch window.
 */
export function getRecruiterJobLimit(
  plan: PlanTier | string | null | undefined,
): number | null {
  if (plan === PlanTier.SCALE || plan === PlanTier.GROWTH) return null;
  if (plan === PlanTier.STARTER) return 2;
  if (isRecruiterTrialActive()) return 4;
  return 0;
}
