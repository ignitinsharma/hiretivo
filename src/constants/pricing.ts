import { CurrencyCode, PricingTierId } from "@/constants/enums";

export type PricingCurrency = CurrencyCode.INR | CurrencyCode.USD;

interface PricePoint {
  monthly: number;
  annual: number;
  annualTotal: number;
  annualSavings: number;
}

interface StartingPricePoint {
  monthly: number;
  annual: number;
}

export interface PricingTier {
  id: PricingTierId | "starter" | "growth" | "enterprise";
  name: string;
  description: string;
  cta: string;
  highlighted: boolean;
  isEnterprise: boolean;
  features: string[];
  USD: PricePoint | null;
  INR: PricePoint | null;
  startingPrice?: Record<PricingCurrency, StartingPricePoint>;
}

export const PRICING_CONFIG: PricingTier[] = [
  {
    id: PricingTierId.FREE,
    name: "Free",
    description: "Get started with essential hiring tools.",
    cta: "Get started",
    highlighted: false,
    isEnterprise: false,
    features: ["5 active job posts", "Basic applicant management", "Email support"],
    USD: { monthly: 0, annual: 0, annualTotal: 0, annualSavings: 0 },
    INR: { monthly: 0, annual: 0, annualTotal: 0, annualSavings: 0 },
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small teams starting to scale hiring.",
    cta: "Start free trial",
    highlighted: false,
    isEnterprise: false,
    features: ["15 active job posts", "Skills-based matching", "Applicant pipeline", "Email + chat support"],
    USD: { monthly: 49, annual: 31, annualTotal: 375, annualSavings: 120 },
    INR: { monthly: 3999, annual: 2499, annualTotal: 29999, annualSavings: 9000 },
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing companies with active hiring needs.",
    cta: "Start free trial",
    highlighted: false,
    isEnterprise: false,
    features: ["Unlimited job posts", "AI candidate ranking", "Interview scheduling", "Analytics dashboard", "Priority support"],
    USD: { monthly: 149, annual: 95, annualTotal: 1140, annualSavings: 360 },
    INR: { monthly: 11999, annual: 7499, annualTotal: 89999, annualSavings: 26000 },
  },
  {
    id: PricingTierId.PRO,
    name: "Pro",
    description: "Advanced tools for high-volume hiring teams.",
    cta: "Start free trial",
    highlighted: true,
    isEnterprise: false,
    features: ["Everything in Growth", "Boost jobs", "AI candidate summaries", "Advanced analytics", "Dedicated account manager"],
    USD: { monthly: 149, annual: 119, annualTotal: 1426, annualSavings: 362 },
    INR: { monthly: 7999, annual: 5999, annualTotal: 71986, annualSavings: 24002 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organisations.",
    cta: "Contact sales",
    highlighted: false,
    isEnterprise: true,
    features: ["Everything in Pro", "Custom integrations", "SLA guarantee", "Dedicated onboarding", "Custom contracts"],
    USD: null,
    INR: null,
    startingPrice: {
      USD: { monthly: 999, annual: 799 },
      INR: { monthly: 79999, annual: 63999 },
    },
  },
];

export const CURRENCY_SYMBOL: Record<PricingCurrency, string> = {
  USD: "$",
  INR: "₹",
};
