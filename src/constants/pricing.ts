import { CurrencyCode, PlanTier } from "@/constants/enums";

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
    name: "Free",
    description: "Browse applicants after posting is enabled. Upgrade for verified talent access.",
    cta: "Get started",
    highlighted: false,
    features: ["Public job browsing", "Skills-first profiles", "Upgrade when ready"],
    USD: annual(0),
    INR: annual(0),
  },
  {
    id: PlanTier.STARTER,
    name: "Starter",
    description: "Start sourcing verified engineers with a focused monthly unlock quota.",
    cta: "Upgrade to Starter",
    highlighted: true,
    features: ["10 engineer unlocks", "2 active jobs", "Verified-only applicant quality"],
    USD: annual(199),
    INR: null,
  },
  {
    id: PlanTier.GROWTH,
    name: "Growth",
    description: "Scale recruiter workflows with more unlocks and unlimited active jobs.",
    cta: "Upgrade to Growth",
    highlighted: false,
    features: ["30 engineer unlocks", "Unlimited active jobs", "Talent pool access"],
    USD: annual(399),
    INR: null,
  },
  {
    id: PlanTier.SCALE,
    name: "Scale",
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

/*
 * PLAN_TIERS
 * Canonical pricing tier config for the Hiretivo talent marketplace.
 * FREE: 0 unlocks, 0 jobs. STARTER: 10 unlocks/mo, 2 active jobs, $199/mo.
 * GROWTH: 30 unlocks/mo, unlimited jobs, $399/mo.
 * SCALE: unlimited unlocks, unlimited jobs, $799/mo.
 */
export const PLAN_TIERS = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    annualPrice: 0,
    unlocks: 0,
    activeJobs: 0,
    description: "Explore the platform at no cost.",
    highlighted: false,
    features: [
      "Browse talent pool (blurred)",
      "0 profile unlocks",
      "0 active job posts",
      "Basic dashboard",
    ],
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    price: 199,
    annualPrice: 166, // ~17% off
    unlocks: 10,
    activeJobs: 2,
    description: "Hire your first remote engineer.",
    highlighted: false,
    features: [
      "10 profile unlocks/mo",
      "2 active job posts",
      "Email engineers directly",
      "Schedule interviews",
      "Save engineers",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    price: 399,
    annualPrice: 331,
    unlocks: 30,
    activeJobs: null, // unlimited
    description: "Scale your hiring pipeline.",
    highlighted: true,
    features: [
      "30 profile unlocks/mo",
      "Unlimited active jobs",
      "Email engineers directly",
      "Schedule interviews",
      "Save engineers",
      "Priority support",
    ],
  },
  SCALE: {
    id: "SCALE",
    name: "Scale",
    price: 799,
    annualPrice: 663,
    unlocks: null, // unlimited
    activeJobs: null, // unlimited
    description: "Unlimited hiring for fast-growing teams.",
    highlighted: false,
    features: [
      "Unlimited profile unlocks",
      "Unlimited active jobs",
      "Email engineers directly",
      "Schedule interviews",
      "Save engineers",
      "Dedicated account manager",
    ],
  },
} as const;

export type PlanTierId = keyof typeof PLAN_TIERS;
