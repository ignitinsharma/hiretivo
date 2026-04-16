import { PlanTier } from "@/constants/enums";

/**
 * Stripe Price IDs for PRO plan variants.
 * Set these in .env.local — create products/prices in Stripe Dashboard first.
 * Server-only — never expose to client.
 */
export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY_USD: process.env.STRIPE_PRO_MONTHLY_USD_PRICE_ID ?? "",
  PRO_ANNUAL_USD: process.env.STRIPE_PRO_ANNUAL_USD_PRICE_ID ?? "",
  PRO_MONTHLY_INR: process.env.STRIPE_PRO_MONTHLY_INR_PRICE_ID ?? "",
  PRO_ANNUAL_INR: process.env.STRIPE_PRO_ANNUAL_INR_PRICE_ID ?? "",
} as const;

/** Map a Stripe priceId string to the corresponding PlanTier (per D-05, D-20). */
export const STRIPE_PRICE_TO_PLAN: Record<string, PlanTier> = {
  [STRIPE_PRICE_IDS.PRO_MONTHLY_USD]: PlanTier.PRO,
  [STRIPE_PRICE_IDS.PRO_ANNUAL_USD]: PlanTier.PRO,
  [STRIPE_PRICE_IDS.PRO_MONTHLY_INR]: PlanTier.PRO,
  [STRIPE_PRICE_IDS.PRO_ANNUAL_INR]: PlanTier.PRO,
};

/** Given a planId ("pro"), period ("monthly"|"annual"), and currency ("USD"|"INR"),
 *  return the correct Stripe Price ID for Checkout Session creation (per D-08). */
export function getStripePriceId(
  planId: string,
  period: "monthly" | "annual",
  currency: "USD" | "INR"
): string | null {
  if (planId !== "pro") return null; // Enterprise has no self-serve checkout per D-03
  const key =
    `PRO_${period.toUpperCase()}_${currency}` as keyof typeof STRIPE_PRICE_IDS;
  return STRIPE_PRICE_IDS[key] || null;
}
