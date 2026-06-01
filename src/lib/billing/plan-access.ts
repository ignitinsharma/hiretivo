import { PlanTier, type RecruiterPaidFeature } from "@/constants/enums";

export function canAccessRecruiterPaidFeature(plan: string | null | undefined): boolean {
  return plan === PlanTier.PRO || plan === PlanTier.ENTERPRISE;
}

export const PAID_FEATURE_COPY: Record<
  RecruiterPaidFeature,
  { title: string; description: string }
> = {
  talent_pool: {
    title: "Unlock the Talent Pool",
    description:
      "Search verified candidates by skills, role, location, and availability. Available on Pro and Enterprise.",
  },
  interview_scheduling: {
    title: "Schedule Interviews from Hiretivo",
    description:
      "Send interview invites and email candidates directly. Available on Pro and Enterprise.",
  },
  ai_candidate_summaries: {
    title: "AI Candidate Summaries",
    description:
      "Get instant AI-powered insights on every candidate. Available on Pro and Enterprise.",
  },
};

export const PAID_FEATURE_FORBIDDEN_MESSAGE =
  "This feature requires Pro or Enterprise. Upgrade your plan to continue.";

export const PAID_FEATURES_BENEFITS = [
  { icon: "users", text: "Search verified candidates by skills & role" },
  { icon: "calendar", text: "Schedule interviews directly" },
  { icon: "sparkles", text: "AI candidate summaries & insights" },
  { icon: "mail", text: "Email candidates directly" },
  { icon: "zap", text: "Cancel anytime, no contracts" },
];
