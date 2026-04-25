import { PlanTier, type RecruiterPaidFeature } from "@/constants/enums";

export function canAccessRecruiterPaidFeature(plan: PlanTier): boolean {
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
};

export const PAID_FEATURE_FORBIDDEN_MESSAGE =
  "This feature requires Pro or Enterprise. Upgrade your plan to continue.";
