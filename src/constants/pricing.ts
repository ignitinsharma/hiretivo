export type PricingCurrency = "INR" | "USD";

interface PricePoint {
  monthly: number;
  annual: number;
  annualTotal: number;
  annualSavings: number;
}

interface EnterprisePricePoint {
  monthly: number;
  annual: number;
}

export interface PricingTier {
  id: "free" | "pro" | "enterprise";
  name: string;
  description: string;
  USD: PricePoint | null;
  INR: PricePoint | null;
  features: string[];
  cta: string;
  highlighted?: boolean;
  isEnterprise?: boolean;
  startingPrice?: {
    USD: EnterprisePricePoint;
    INR: EnterprisePricePoint;
  };
}

export const PRICING_CONFIG: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Try Hiretivo, no credit card needed",
    USD: { monthly: 0, annual: 0, annualTotal: 0, annualSavings: 0 },
    INR: { monthly: 0, annual: 0, annualTotal: 0, annualSavings: 0 },
    features: [
      "1 active job post",
      "20 applicant views/mo",
      "Basic AI skill match",
      "Email support",
    ],
    cta: "Get started free",
  },
  {
    id: "pro",
    name: "PRO",
    description: "Scale your engineering team",
    USD: { monthly: 149, annual: 119, annualTotal: 1428, annualSavings: 360 },
    INR: { monthly: 7999, annual: 5999, annualTotal: 71988, annualSavings: 23988 },
    features: [
      "10 active job posts",
      "Advanced AI skill matching",
      "Interview scheduling",
      "ATS integration",
      "Unlimited resume DB",
      "Priority support",
      "2 team members",
    ],
    cta: "Start PRO plan",
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For high-volume hiring orgs",
    USD: null,
    INR: null,
    features: [
      "Unlimited job posts",
      "Unlimited seats",
      "ATS integration",
      "Interview scheduling",
      "Priority support + dedicated CSM",
      "SSO / SAML",
      "Custom integrations",
      "White-label option (coming soon)",
    ],
    cta: "Start Enterprise plan",
    isEnterprise: true,
    startingPrice: {
      USD: { monthly: 299, annual: 199 },
      INR: { monthly: 24999, annual: 15999 },
    },
  },
];

export const CURRENCY_SYMBOL: Record<PricingCurrency, string> = {
  USD: "$",
  INR: "₹",
};
