import { PricingTierId } from "@/constants/enums";

export interface PlanTierConfig {
  id: PricingTierId | "custom";
  name: string;
  monthlyPrice: number | null;
  annualTotal: number | null;
  annualSavings: number | null;
  unlocks: number | null;
  jobSlots: number | null;
  highlighted: boolean;
  isCustom: boolean;
  features: string[];
  cta: string;
}

/*
 * PLAN_TIERS
 * Canonical pricing config for the pivot model. USD only.
 * Annual = 2 months free (~17% off): monthlyPrice × 10.
 */
export const PLAN_TIERS: PlanTierConfig[] = [
  {
    id: PricingTierId.FREE,
    name: "Free",
    monthlyPrice: 0,
    annualTotal: 0,
    annualSavings: 0,
    unlocks: 3,
    jobSlots: 1,
    highlighted: false,
    isCustom: false,
    features: [
      "3 talent pool unlocks",
      "1 active job post",
      "25 applicant profiles per job",
      "Browse talent pool previews",
      "AI summaries, JD & skills — Limited",
      "Basic skill matching",
    ],
    cta: "Get started free",
  },
  {
    id: PricingTierId.STARTER,
    name: "Starter",
    monthlyPrice: 199,
    annualTotal: 1990,
    annualSavings: 398,
    unlocks: 10,
    jobSlots: 2,
    highlighted: false,
    isCustom: false,
    features: [
      "10 talent pool unlocks per month",
      "2 active job posts",
      "Unlimited applicant profiles",
      "Full contact details after unlock",
      "Unlimited AI tools (summaries, JD, skills)",
      "Interview scheduling",
    ],
    cta: "Start with Starter",
  },
  {
    id: PricingTierId.GROWTH,
    name: "Growth",
    monthlyPrice: 399,
    annualTotal: 3990,
    annualSavings: 798,
    unlocks: 30,
    jobSlots: null,
    highlighted: true,
    isCustom: false,
    features: [
      "30 talent pool unlocks per month",
      "Unlimited active job posts",
      "Unlimited applicant profiles",
      "Full contact details after unlock",
      "Unlimited AI tools (summaries, JD, skills)",
      "Interview scheduling",
    ],
    cta: "Grow with Growth",
  },
  {
    id: PricingTierId.SCALE,
    name: "Scale",
    monthlyPrice: 799,
    annualTotal: 7990,
    annualSavings: 1598,
    unlocks: null,
    jobSlots: null,
    highlighted: false,
    isCustom: false,
    features: [
      "Unlimited talent pool unlocks",
      "Unlimited active job posts",
      "Unlimited applicant profiles",
      "Full contact details after unlock",
      "Unlimited AI tools (summaries, JD, skills)",
      "Dedicated onboarding",
    ],
    cta: "Scale your hiring",
  },
  {
    id: "custom",
    name: "Enterprise",
    monthlyPrice: null,
    annualTotal: null,
    annualSavings: null,
    unlocks: null,
    jobSlots: null,
    highlighted: false,
    isCustom: true,
    features: [
      "Everything in Scale",
      "Custom contract terms",
      "SLA guarantees",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Contact sales",
  },
];

// Backward-compat alias — remove once pricing-client.tsx is updated
export const PRICING_CONFIG = PLAN_TIERS;
export const CURRENCY_SYMBOL = { USD: "$", INR: "₹" } as const;
