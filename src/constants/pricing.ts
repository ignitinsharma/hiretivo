import { PricingTierId } from "@/constants/enums";

export interface PlanTierConfig {
  id: PricingTierId;
  name: string;
  monthlyPrice: number | null;
  annualTotal: number | null;
  annualSavings: number | null;
  generations: number | string;
  highlighted: boolean;
  features: string[];
  cta: string;
}

/*
 * FREE_GENERATIONS_PROMO_UNTIL
 * Launch promo: free users get 10 resume generations/month until this date,
 * then it auto-reverts to the standard 5. Single source of truth — the pricing
 * page, quota enforcement, and all home-page copy read getFreeGenerationLimit().
 * Change the date to extend/shorten; nothing else needs editing.
 */
export const FREE_GENERATIONS_PROMO_UNTIL = new Date("2026-08-31T23:59:59.999Z");

export function getFreeGenerationLimit(): number {
  return Date.now() < FREE_GENERATIONS_PROMO_UNTIL.getTime() ? 10 : 5;
}

export function isFreeGenerationPromoActive(): boolean {
  return Date.now() < FREE_GENERATIONS_PROMO_UNTIL.getTime();
}

export const PLAN_TIERS: PlanTierConfig[] = [
  {
    id: PricingTierId.FREE,
    name: "Free",
    monthlyPrice: 0,
    annualTotal: 0,
    annualSavings: 0,
    generations: getFreeGenerationLimit(),
    highlighted: false,
    features: [
      `${getFreeGenerationLimit()} resume generations per month`,
      ...(isFreeGenerationPromoActive()
        ? ["Limited-time launch offer — double your free generations"]
        : []),
      "AI-powered tailoring per job",
      "Cover letter generation",
      "Basic application tracking",
      "Download as PDF",
    ],
    cta: "Get started free",
  },
  {
    id: PricingTierId.PRO,
    name: "Pro",
    monthlyPrice: 7,
    annualTotal: 70,
    annualSavings: 14,
    generations: 20,
    highlighted: true,
    features: [
      "20 resume generations per month",
      "Priority AI processing",
      "Cover letter generation",
      "Full application tracking",
      "Editable resume preview",
      "PDF download with edits",
    ],
    cta: "Go Pro",
  },
  {
    id: PricingTierId.UNLIMITED,
    name: "Unlimited",
    monthlyPrice: 12,
    annualTotal: 120,
    annualSavings: 24,
    generations: "Unlimited",
    highlighted: false,
    features: [
      "Unlimited resume generations",
      "Priority AI processing",
      "Cover letter generation",
      "Full application tracking",
      "Editable resume preview",
      "PDF download with edits",
      "Early access to new features",
    ],
    cta: "Go Unlimited",
  },
];

export const PRICING_CONFIG = PLAN_TIERS;
export const CURRENCY_SYMBOL = { USD: "$", INR: "₹" } as const;
