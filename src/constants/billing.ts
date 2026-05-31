import { BillingPeriod, PlanTier } from "@/constants/enums";

/*
 * Dodo Payments product IDs for each tier + billing period.
 * Set these env vars in Dodo dashboard for each plan.
 * USD only — one product per tier per period.
 */
export const DODO_PRODUCT_IDS = {
  STARTER_MONTHLY: process.env.DODO_STARTER_MONTHLY_PRODUCT_ID ?? "",
  STARTER_ANNUAL:  process.env.DODO_STARTER_ANNUAL_PRODUCT_ID ?? "",
  GROWTH_MONTHLY:  process.env.DODO_GROWTH_MONTHLY_PRODUCT_ID ?? "",
  GROWTH_ANNUAL:   process.env.DODO_GROWTH_ANNUAL_PRODUCT_ID ?? "",
  SCALE_MONTHLY:   process.env.DODO_SCALE_MONTHLY_PRODUCT_ID ?? "",
  SCALE_ANNUAL:    process.env.DODO_SCALE_ANNUAL_PRODUCT_ID ?? "",
} as const;

/*
 * Maps Dodo product ID → PlanTier.
 * Used by webhook handler to determine plan on subscription events.
 */
export const DODO_PRODUCT_TO_PLAN: Record<string, PlanTier> = {
  [DODO_PRODUCT_IDS.STARTER_MONTHLY]: PlanTier.STARTER,
  [DODO_PRODUCT_IDS.STARTER_ANNUAL]:  PlanTier.STARTER,
  [DODO_PRODUCT_IDS.GROWTH_MONTHLY]:  PlanTier.GROWTH,
  [DODO_PRODUCT_IDS.GROWTH_ANNUAL]:   PlanTier.GROWTH,
  [DODO_PRODUCT_IDS.SCALE_MONTHLY]:   PlanTier.SCALE,
  [DODO_PRODUCT_IDS.SCALE_ANNUAL]:    PlanTier.SCALE,
};

type PaidTier = PlanTier.STARTER | PlanTier.GROWTH | PlanTier.SCALE;

/*
 * Returns the Dodo product ID for a paid tier + billing period.
 * USD only. Returns null if the env var is not configured.
 */
export function getDodoProductId(tier: PaidTier, period: BillingPeriod): string | null {
  switch (tier) {
    case PlanTier.STARTER:
      return period === BillingPeriod.ANNUAL
        ? DODO_PRODUCT_IDS.STARTER_ANNUAL || null
        : DODO_PRODUCT_IDS.STARTER_MONTHLY || null;
    case PlanTier.GROWTH:
      return period === BillingPeriod.ANNUAL
        ? DODO_PRODUCT_IDS.GROWTH_ANNUAL || null
        : DODO_PRODUCT_IDS.GROWTH_MONTHLY || null;
    case PlanTier.SCALE:
      return period === BillingPeriod.ANNUAL
        ? DODO_PRODUCT_IDS.SCALE_ANNUAL || null
        : DODO_PRODUCT_IDS.SCALE_MONTHLY || null;
  }
}
