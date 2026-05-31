import { PricingTierId } from "@/constants/enums";

interface PricePoint {
  monthly: number;
  annualTotal: number;
  annualSavings: number;
}

export interface PricingTier {
  id: PricingTierId | "custom";
  name: string;
  description: string;
  cta: string;
  highlighted: boolean;
  isCustom: boolean;
  unlockQuota: number | null;
  activeJobLimit: number | null;
  priorityMatch: boolean;
  features: string[];
  USD: PricePoint | null;
}

/*
 * PIVOT.md §5 — Recruiter pricing tiers.
 * Annual = monthly × 10 (2 months free ≈ 17% off).
 * USD only — INR removed per marketplace pivot.
 */
export const PRICING_CONFIG: PricingTier[] = [
  {
    id: PricingTierId.FREE,
    name: "Free",
    description: "Browse the verified talent pool. Upgrade to unlock engineers and post jobs.",
    cta: "Get started free",
    highlighted: false,
    isCustom: false,
    unlockQuota: 0,
    activeJobLimit: 0,
    priorityMatch: false,
    features: [
      "Browse verified engineer profiles",
      "See Hiretivo Score & skills",
      "Save engineers to shortlist",
      "View salary ranges & availability",
    ],
    USD: { monthly: 0, annualTotal: 0, annualSavings: 0 },
  },
  {
    id: PricingTierId.STARTER,
    name: "Starter",
    description: "Unlock 10 engineers per month and post up to 2 active jobs.",
    cta: "Start hiring",
    highlighted: true,
    isCustom: false,
    unlockQuota: 10,
    activeJobLimit: 2,
    priorityMatch: false,
    features: [
      "10 engineer unlocks/month",
      "2 active job posts",
      "Full PII reveal on unlock (email, GitHub, LinkedIn)",
      "Direct email + interview scheduling",
      "Browse full talent pool",
    ],
    USD: { monthly: 199, annualTotal: 1990, annualSavings: 398 },
  },
  {
    id: PricingTierId.GROWTH,
    name: "Growth",
    description: "Scale your pipeline with 30 unlocks and unlimited job posts.",
    cta: "Upgrade to Growth",
    highlighted: false,
    isCustom: false,
    unlockQuota: 30,
    activeJobLimit: null,
    priorityMatch: true,
    features: [
      "30 engineer unlocks/month",
      "Unlimited active job posts",
      "Priority match scoring",
      "Full PII reveal on unlock",
      "Direct email + interview scheduling",
    ],
    USD: { monthly: 399, annualTotal: 3990, annualSavings: 798 },
  },
  {
    id: PricingTierId.SCALE,
    name: "Scale",
    description: "Unlimited unlocks, unlimited posts, and dedicated support.",
    cta: "Upgrade to Scale",
    highlighted: false,
    isCustom: false,
    unlockQuota: null,
    activeJobLimit: null,
    priorityMatch: true,
    features: [
      "Unlimited engineer unlocks",
      "Unlimited active job posts",
      "Priority match scoring",
      "Dedicated support",
      "Full PII reveal on unlock",
    ],
    USD: { monthly: 799, annualTotal: 7990, annualSavings: 1598 },
  },
];

export const CURRENCY_SYMBOL = "$";
