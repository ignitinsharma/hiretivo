import { PlanTier, PricingTierId } from "@/constants/enums";
import { MONTHLY_CREDITS } from "@/lib/billing/ai-daily-limit";

export interface PlanTierConfig {
  id: PricingTierId;
  name: string;
  monthlyPrice: number;
  annualTotal: number;
  annualSavings: number;
  monthlyCredits: number;
  highlighted: boolean;
  features: string[];
  cta: string;
}

/*
 * PLAN_TIERS
 * Ladder-A seeker AI-credit pricing (Phase 8). USD only. Annual = 10x monthly
 * (2 months free, ~17% off). PricingTierId keeps its recruiter-era member
 * names (starter/growth) — Option-A remap: same enum/product IDs, only the
 * seeker-facing name changes (Pro/Max). SCALE is intentionally omitted here —
 * hidden in seeker UI, same credit grant as Max.
 */
export const PLAN_TIERS: PlanTierConfig[] = [
  {
    id: PricingTierId.FREE,
    name: "Free",
    monthlyPrice: 0,
    annualTotal: 0,
    annualSavings: 0,
    monthlyCredits: MONTHLY_CREDITS[PlanTier.FREE],
    highlighted: false,
    features: [
      `${MONTHLY_CREDITS[PlanTier.FREE]} AI-tailored applications / month`,
      "Match-ranked job feed",
      "ATS-safe resume + cover letter",
      "Application tracker",
      "Add your own job link",
    ],
    cta: "Get started free",
  },
  {
    id: PricingTierId.STARTER,
    name: "Pro",
    monthlyPrice: 9,
    annualTotal: 90,
    annualSavings: 18,
    monthlyCredits: MONTHLY_CREDITS[PlanTier.STARTER],
    highlighted: true,
    features: [
      `${MONTHLY_CREDITS[PlanTier.STARTER]} AI-tailored applications / month`,
      "Match-ranked job feed",
      "ATS-safe resume + cover letter",
      "Application tracker + notes",
      "Add your own job link",
      "Interview-rate analytics",
    ],
    cta: "Upgrade to Pro",
  },
  {
    id: PricingTierId.GROWTH,
    name: "Max",
    monthlyPrice: 19,
    annualTotal: 190,
    annualSavings: 38,
    monthlyCredits: MONTHLY_CREDITS[PlanTier.GROWTH],
    highlighted: false,
    features: [
      `${MONTHLY_CREDITS[PlanTier.GROWTH]} AI-tailored applications / month`,
      "Match-ranked job feed",
      "ATS-safe resume + cover letter",
      "Application tracker + notes",
      "Add your own job link",
      "Interview-rate analytics",
      "Priority support",
    ],
    cta: "Upgrade to Max",
  },
];
