import { BillingPeriod, PlanTier, PricingTierId } from "@/constants/enums";

/*
 * DODO_PRODUCT_IDS
 * Environment-variable-backed Dodo Payments product IDs for each plan+period combo.
 * USD only. Annual = 2 months free (~17% off monthly price).
 */
export const DODO_PRODUCT_IDS = {
  PRO_MONTHLY_USD: process.env.DODO_PRO_MONTHLY_PRODUCT_ID ?? "",
  PRO_ANNUAL_USD:  process.env.DODO_PRO_ANNUAL_PRODUCT_ID ?? "",
  UNLIMITED_MONTHLY_USD: process.env.DODO_UNLIMITED_MONTHLY_PRODUCT_ID ?? "",
  UNLIMITED_ANNUAL_USD:  process.env.DODO_UNLIMITED_ANNUAL_PRODUCT_ID ?? "",
} as const;

/*
 * DODO_PRODUCT_TO_PLAN
 * Maps a Dodo product ID → PlanTier so the webhook knows which plan to grant.
 * Only lists non-empty product IDs to avoid mapping empty string → plan.
 */
export const DODO_PRODUCT_TO_PLAN: Record<string, PlanTier> = Object.fromEntries(
  [
    [DODO_PRODUCT_IDS.PRO_MONTHLY_USD, PlanTier.PRO],
    [DODO_PRODUCT_IDS.PRO_ANNUAL_USD,  PlanTier.PRO],
    [DODO_PRODUCT_IDS.UNLIMITED_MONTHLY_USD, PlanTier.UNLIMITED],
    [DODO_PRODUCT_IDS.UNLIMITED_ANNUAL_USD,  PlanTier.UNLIMITED],
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
 * FREE=0, PRO=1, UNLIMITED=2.
 */
export const PLAN_RANK: Record<PlanTier, number> = {
  [PlanTier.FREE]: 0,
  [PlanTier.PRO]: 1,
  [PlanTier.UNLIMITED]: 2,
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
 * Returns null if no match is found.
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
 * PlanTier.PRO → PricingTierId.PRO, etc. FREE → PricingTierId.FREE.
 */
export function getPlanTierId(plan: PlanTier): PricingTierId {
  const map: Record<PlanTier, PricingTierId> = {
    [PlanTier.FREE]: PricingTierId.FREE,
    [PlanTier.PRO]: PricingTierId.PRO,
    [PlanTier.UNLIMITED]: PricingTierId.UNLIMITED,
  };
  return map[plan];
}
