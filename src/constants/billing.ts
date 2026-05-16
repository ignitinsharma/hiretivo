import { BillingPeriod, CurrencyCode, PlanTier } from "@/constants/enums";

export const DODO_PRODUCT_IDS = {
  STARTER_MONTHLY_USD: process.env.DODO_STARTER_MONTHLY_PRODUCT_ID ?? "",
  STARTER_ANNUAL_USD: process.env.DODO_STARTER_ANNUAL_PRODUCT_ID ?? "",
  STARTER_MONTHLY_INR: process.env.DODO_STARTER_MONTHLY_INR_PRODUCT_ID ?? "",
  STARTER_ANNUAL_INR: process.env.DODO_STARTER_ANNUAL_INR_PRODUCT_ID ?? "",
  GROWTH_MONTHLY_USD: process.env.DODO_GROWTH_MONTHLY_PRODUCT_ID ?? "",
  GROWTH_ANNUAL_USD: process.env.DODO_GROWTH_ANNUAL_PRODUCT_ID ?? "",
  SCALE_MONTHLY_USD: process.env.DODO_SCALE_MONTHLY_PRODUCT_ID ?? "",
} as const;

export const DODO_PRODUCT_TO_PLAN = Object.fromEntries(
  [
    [DODO_PRODUCT_IDS.STARTER_MONTHLY_USD, PlanTier.STARTER],
    [DODO_PRODUCT_IDS.STARTER_ANNUAL_USD, PlanTier.STARTER],
    [DODO_PRODUCT_IDS.STARTER_MONTHLY_INR, PlanTier.STARTER],
    [DODO_PRODUCT_IDS.STARTER_ANNUAL_INR, PlanTier.STARTER],
    [DODO_PRODUCT_IDS.GROWTH_MONTHLY_USD, PlanTier.GROWTH],
    [DODO_PRODUCT_IDS.GROWTH_ANNUAL_USD, PlanTier.GROWTH],
    [DODO_PRODUCT_IDS.SCALE_MONTHLY_USD, PlanTier.SCALE],
  ].filter(([productId]) => productId),
) as Record<string, PlanTier>;

export function getDodoProductId(
  tier: PlanTier.STARTER | PlanTier.GROWTH | PlanTier.SCALE,
  period: BillingPeriod,
  currency: CurrencyCode.USD | CurrencyCode.INR = CurrencyCode.USD,
): string | null {
  if (tier === PlanTier.STARTER) {
    if (currency === CurrencyCode.INR) {
      return period === BillingPeriod.ANNUAL
        ? DODO_PRODUCT_IDS.STARTER_ANNUAL_INR || null
        : DODO_PRODUCT_IDS.STARTER_MONTHLY_INR || null;
    }
    return period === BillingPeriod.ANNUAL
      ? DODO_PRODUCT_IDS.STARTER_ANNUAL_USD || null
      : DODO_PRODUCT_IDS.STARTER_MONTHLY_USD || null;
  }

  if (tier === PlanTier.GROWTH) {
    return period === BillingPeriod.ANNUAL
      ? DODO_PRODUCT_IDS.GROWTH_ANNUAL_USD || null
      : DODO_PRODUCT_IDS.GROWTH_MONTHLY_USD || null;
  }

  return DODO_PRODUCT_IDS.SCALE_MONTHLY_USD || null;
}
