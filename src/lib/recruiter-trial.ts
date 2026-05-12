import { PlanTier } from "@/constants/enums";

export function isRecruiterTrialActive(): boolean {
  const end = process.env.RECRUITER_TRIAL_ENDS;
  if (!end) return false;
  return new Date() < new Date(end);
}

export function getRecruiterJobLimit(
  plan: PlanTier | string | null | undefined,
): number | null {
  if (plan === PlanTier.ENTERPRISE) return null;
  if (plan === PlanTier.PRO) return 10;
  if (isRecruiterTrialActive()) return 4;
  return 1;
}
