import { PlanTier, type RecruiterPaidFeature } from "@/constants/enums";

export function canAccessRecruiterPaidFeature(plan: string | null | undefined): boolean {
  return plan === PlanTier.STARTER || plan === PlanTier.GROWTH || plan === PlanTier.SCALE;
}

export const PAID_FEATURE_COPY: Record<
  RecruiterPaidFeature,
  { title: string; description: string }
> = {
  talent_pool: {
    title: "Unlock the Talent Pool",
    description:
      "Search verified candidates by skills, role, location, and availability. Available on paid recruiter plans.",
  },
  interview_scheduling: {
    title: "Schedule Interviews from Hiretivo",
    description:
      "Send interview invites and email candidates directly. Available on paid recruiter plans.",
  },
  ai_candidate_summaries: {
    title: "AI Candidate Summaries",
    description:
      "Get instant AI-powered insights on every candidate. Available on paid recruiter plans.",
  },
};

export const PAID_FEATURE_FORBIDDEN_MESSAGE =
  "This feature requires a paid recruiter plan. Upgrade your plan to continue.";

export const PAID_FEATURES_BENEFITS = [
  { icon: "users", text: "Search verified candidates by skills & role" },
  { icon: "calendar", text: "Schedule interviews directly" },
  { icon: "sparkles", text: "AI candidate summaries & insights" },
  { icon: "mail", text: "Email candidates directly" },
  { icon: "zap", text: "Cancel anytime, no contracts" },
];
