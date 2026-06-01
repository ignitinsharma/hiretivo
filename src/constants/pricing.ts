import { CurrencyCode, PricingTierId } from "@/constants/enums";

export type PricingCurrency = CurrencyCode.INR | CurrencyCode.USD;

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
  features: string[];
  USD: PricePoint | null;
  INR: PricePoint | null;
}

export const PRICING_CONFIG: PricingTier[] = [
  {
    id: PricingTierId.FREE,
    name: "Free",
    description: "Trial offer — post up to 4 jobs and use AI features for free.",
    cta: "Get started",
    highlighted: false,
    isCustom: false,
    features: [
      "4 active job posts",
      "Unlimited applicant views",
      "AI candidate summaries",
      "Interview scheduling",
      "Basic skill matching",
      "Email support",
    ],
    USD: { monthly: 0, annualTotal: 0, annualSavings: 0 },
    INR: { monthly: 0, annualTotal: 0, annualSavings: 0 },
  },
  {
    id: PricingTierId.PRO,
    name: "Pro",
    description: "Advanced hiring tools for growing recruiter teams.",
    cta: "Upgrade to Pro",
    highlighted: true,
    isCustom: false,
    features: [
      "10 active job posts",
      "Unlimited applicant views",
      "Talent pool access",
      "Interview scheduling",
      "AI candidate summaries",
      "More features coming soon",
    ],
    USD: { monthly: 149, annualTotal: 1426, annualSavings: 362 },
    INR: { monthly: 7999, annualTotal: 71986, annualSavings: 24002 },
  },
  {
    id: "custom",
    name: "Custom",
    description: "Flexible hiring workflows for teams with custom needs.",
    cta: "Contact sales",
    highlighted: false,
    isCustom: true,
    features: [
      "Everything in Pro",
      "Custom contract terms",
      "Dedicated onboarding",
      "SLA options",
      "Priority support",
    ],
    USD: null,
    INR: null,
  },
];

export const CURRENCY_SYMBOL: Record<PricingCurrency, string> = {
  USD: "$",
  INR: "₹",
};
