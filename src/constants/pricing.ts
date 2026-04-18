export type PricingCurrency = "INR" | "USD";

interface PricePoint {
  monthly: number;
  annual: number;
  annualTotal: number;
  annualSavings: number;
}

export interface PricingTier {
  id: "free" | "starter" | "growth" | "pro" | "enterprise";
  name: string;
  USD: PricePoint | null;
  INR: PricePoint | null;
}

export const PRICING_CONFIG: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    USD: { monthly: 0, annual: 0, annualTotal: 0, annualSavings: 0 },
    INR: { monthly: 0, annual: 0, annualTotal: 0, annualSavings: 0 },
  },
  {
    id: "starter",
    name: "Starter",
    USD: { monthly: 49, annual: 31, annualTotal: 375, annualSavings: 120 },
    INR: { monthly: 3999, annual: 2499, annualTotal: 29999, annualSavings: 9000 },
  },
  {
    id: "growth",
    name: "Growth",
    USD: { monthly: 149, annual: 95, annualTotal: 1140, annualSavings: 360 },
    INR: { monthly: 11999, annual: 7499, annualTotal: 89999, annualSavings: 26000 },
  },
  {
    id: "pro",
    name: "Pro",
    USD: { monthly: 299, annual: 191, annualTotal: 2295, annualSavings: 720 },
    INR: { monthly: 24999, annual: 15999, annualTotal: 191999, annualSavings: 60000 },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    USD: null,
    INR: null,
  },
];

export const CURRENCY_SYMBOL: Record<PricingCurrency, string> = {
  USD: "$",
  INR: "₹",
};
