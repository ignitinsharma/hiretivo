import { BillingPeriod, PlanTier, PricingTierId } from "@/constants/enums";

/*
 * DODO_PRODUCT_IDS
 * Environment-variable-backed Dodo Payments product IDs for each plan+period combo.
 * USD only. Annual = 2 months free (~17% off monthly price).
 */
export const DODO_PRODUCT_IDS = {
  STARTER_MONTHLY_USD: process.env.DODO_STARTER_MONTHLY_PRODUCT_ID ?? "",
  STARTER_ANNUAL_USD:  process.env.DODO_STARTER_ANNUAL_PRODUCT_ID ?? "",
  GROWTH_MONTHLY_USD:  process.env.DODO_GROWTH_MONTHLY_PRODUCT_ID ?? "",
  GROWTH_ANNUAL_USD:   process.env.DODO_GROWTH_ANNUAL_PRODUCT_ID ?? "",
  SCALE_MONTHLY_USD:   process.env.DODO_SCALE_MONTHLY_PRODUCT_ID ?? "",
  SCALE_ANNUAL_USD:    process.env.DODO_SCALE_ANNUAL_PRODUCT_ID ?? "",
} as const;

/*
 * DODO_PRODUCT_TO_PLAN
 * Maps a Dodo product ID → PlanTier so the webhook knows which plan to grant.
 * Only lists non-empty product IDs to avoid mapping empty string → plan.
 */
export const DODO_PRODUCT_TO_PLAN: Record<string, PlanTier> = Object.fromEntries(
  [
    [DODO_PRODUCT_IDS.STARTER_MONTHLY_USD, PlanTier.STARTER],
    [DODO_PRODUCT_IDS.STARTER_ANNUAL_USD,  PlanTier.STARTER],
    [DODO_PRODUCT_IDS.GROWTH_MONTHLY_USD,  PlanTier.GROWTH],
    [DODO_PRODUCT_IDS.GROWTH_ANNUAL_USD,   PlanTier.GROWTH],
    [DODO_PRODUCT_IDS.SCALE_MONTHLY_USD,   PlanTier.SCALE],
    [DODO_PRODUCT_IDS.SCALE_ANNUAL_USD,    PlanTier.SCALE],
  ].filter(([productId]) => Boolean(productId))
);

/*
 * getDodoProductId
 * Returns the Dodo product ID for a given plan + billing period.
 * Returns null when the env var is missing (checkout will surface a 400).
 */
export function getDodoProductId(
  planId: PricingTierId,
  period: BillingPeriod,
): string | null {
  const periodKey = period === BillingPeriod.ANNUAL ? "ANNUAL" : "MONTHLY";
  const key = `${planId.toUpperCase()}_${periodKey}_USD` as keyof typeof DODO_PRODUCT_IDS;
  return DODO_PRODUCT_IDS[key] || null;
}
