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
    unlocks: 0,
    jobSlots: 0,
    highlighted: false,
    isCustom: false,
    features: [
      "Browse blurred talent pool",
      "Unlimited applicant views (inbound)",
      "AI candidate summaries",
      "Interview scheduling",
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
      "10 engineer unlocks per month",
      "2 active job posts",
      "Full contact details after unlock",
      "AI candidate summaries",
      "Interview scheduling",
      "Priority email support",
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
      "30 engineer unlocks per month",
      "Unlimited active job posts",
      "Full contact details after unlock",
      "AI candidate summaries",
      "Interview scheduling",
      "Priority email support",
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
      "Unlimited engineer unlocks",
      "Unlimited active job posts",
      "Full contact details after unlock",
      "AI candidate summaries",
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
