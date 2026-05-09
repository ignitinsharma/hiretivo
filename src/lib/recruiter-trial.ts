import { PlanTier } from "@/constants/enums";

export function isRecruiterTrialActive(): boolean {
  const end = process.env.RECRUITER_TRIAL_ENDS;
  if (!end) return false;
  return new Date() < new Date(end);
}

export function getRecruiterJobLimit(plan: PlanTier | string | null | undefined): number {
  if (plan === PlanTier.PRO || plan === PlanTier.ENTERPRISE) return 10;
  if (isRecruiterTrialActive()) return 4;
  return 1;
}