import { CurrencyCode, PlanTier } from "@/constants/enums";

/*
 * PLAN_TIERS
 * Pivot v2 four-tier pricing for recruiter plans.
 * unlocks: number of engineer profile unlocks per billing period (null = unlimited).
 * activeJobs: max concurrent open jobs (null = unlimited).
 */
export const PLAN_TIERS = {
  FREE: { name: "Free", price: 0, unlocks: 0, activeJobs: 0 },
  STARTER: { name: "Starter", price: 199, unlocks: 10, activeJobs: 2 },
  GROWTH: { name: "Growth", price: 399, unlocks: 30, activeJobs: null },
  SCALE: { name: "Scale", price: 799, unlocks: null, activeJobs: null },
} as const;

export type PlanTierKey = keyof typeof PLAN_TIERS;

export type PricingCurrency = CurrencyCode.INR | CurrencyCode.USD;

interface PricePoint {
  monthly: number;
  annualTotal: number;
  annualSavings: number;
}

export interface PricingTier {
  id: PlanTier;
  name: string;
  description: string;
  cta: string;
  highlighted: boolean;
  features: string[];
  USD: PricePoint;
  INR: PricePoint | null;
}

function annual(monthly: number): PricePoint {
  const annualTotal = Math.round(monthly * 12 * 0.8);
  return {
    monthly,
    annualTotal,
    annualSavings: monthly * 12 - annualTotal,
  };
}

export const PRICING_CONFIG: PricingTier[] = [
  {
    id: PlanTier.FREE,
    name: PLAN_TIERS.FREE.name,
    description: "Browse applicants after posting is enabled. Upgrade for verified talent access.",
    cta: "Get started",
    highlighted: false,
    features: ["Public job browsing", "Skills-first profiles", "Upgrade when ready"],
    USD: annual(0),
    INR: annual(0),
  },
  {
    id: PlanTier.STARTER,
    name: PLAN_TIERS.STARTER.name,
    description: "Start sourcing verified engineers with a focused monthly unlock quota.",
    cta: "Upgrade to Starter",
    highlighted: true,
    features: ["10 engineer unlocks", "2 active jobs", "Verified-only applicant quality"],
    USD: annual(199),
    INR: null,
  },
  {
    id: PlanTier.GROWTH,
    name: PLAN_TIERS.GROWTH.name,
    description: "Scale recruiter workflows with more unlocks and unlimited active jobs.",
    cta: "Upgrade to Growth",
    highlighted: false,
    features: ["30 engineer unlocks", "Unlimited active jobs", "Talent pool access"],
    USD: annual(399),
    INR: null,
  },
  {
    id: PlanTier.SCALE,
    name: PLAN_TIERS.SCALE.name,
    description: "Unlimited unlocks for teams hiring continuously.",
    cta: "Upgrade to Scale",
    highlighted: false,
    features: ["Unlimited engineer unlocks", "Unlimited active jobs", "Priority hiring workflows"],
    USD: annual(799),
    INR: null,
  },
];

export const CURRENCY_SYMBOL: Record<PricingCurrency, string> = {
  USD: "$",
  INR: "₹",
};
