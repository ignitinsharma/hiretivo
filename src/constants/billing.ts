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

/*
 * PLAN_RANK
 * Numeric rank for each PlanTier — used to determine upgrade vs downgrade direction.
 * FREE=0, STARTER=1, GROWTH=2, SCALE=3.
 */
export const PLAN_RANK: Record<PlanTier, number> = {
  [PlanTier.FREE]: 0,
  [PlanTier.STARTER]: 1,
  [PlanTier.GROWTH]: 2,
  [PlanTier.SCALE]: 3,
};

/*
 * getPlanChangeDirection
 * Compares current and target PlanTier ranks and returns the direction of change.
 * Returns "upgrade" | "downgrade" | "same".
 * Always computed server-side — the client cannot spoof this.
 */
export function getPlanChangeDirection(
  current: PlanTier,
  target: PlanTier,
): "upgrade" | "downgrade" | "same" {
  const currentRank = PLAN_RANK[current];
  const targetRank = PLAN_RANK[target];
  if (targetRank > currentRank) return "upgrade";
  if (targetRank < currentRank) return "downgrade";
  return "same";
}

/*
 * getProductPeriod
 * Reverse-lookup: given a Dodo product ID, returns the BillingPeriod it belongs to.
 * Iterates DODO_PRODUCT_IDS keys — key contains _MONTHLY_ or _ANNUAL_ — and matches
 * against the productId param. Returns null if no match is found.
 */
export function getProductPeriod(productId: string): BillingPeriod | null {
  for (const [key, value] of Object.entries(DODO_PRODUCT_IDS)) {
    if (value === productId) {
      if (key.includes("_ANNUAL_")) return BillingPeriod.ANNUAL;
      if (key.includes("_MONTHLY_")) return BillingPeriod.MONTHLY;
    }
  }
  return null;
}

/*
 * getPlanTierId
 * Maps a PlanTier enum value to the corresponding PricingTierId.
 * Used with getDodoProductId when only a PlanTier is available.
 * PlanTier.STARTER → PricingTierId.STARTER, etc. FREE → PricingTierId.FREE.
 */
export function getPlanTierId(plan: PlanTier): PricingTierId {
  const map: Record<PlanTier, PricingTierId> = {
    [PlanTier.FREE]: PricingTierId.FREE,
    [PlanTier.STARTER]: PricingTierId.STARTER,
    [PlanTier.GROWTH]: PricingTierId.GROWTH,
    [PlanTier.SCALE]: PricingTierId.SCALE,
  };
  return map[plan];
}
