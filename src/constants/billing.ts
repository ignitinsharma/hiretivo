import { BillingPeriod, CurrencyCode, PlanTier } from "@/constants/enums";

export const DODO_PRODUCT_IDS = {
  PRO_MONTHLY_USD: process.env.DODO_PRO_MONTHLY_PRODUCT_ID ?? "",
  PRO_ANNUAL_USD: process.env.DODO_PRO_ANNUAL_PRODUCT_ID ?? "",
  PRO_MONTHLY_INR: process.env.DODO_PRO_MONTHLY_INR_PRODUCT_ID ?? "",
  PRO_ANNUAL_INR: process.env.DODO_PRO_ANNUAL_INR_PRODUCT_ID ?? "",
} as const;

export const DODO_PRODUCT_TO_PLAN: Record<string, PlanTier> = {
  [DODO_PRODUCT_IDS.PRO_MONTHLY_USD]: PlanTier.PRO,
  [DODO_PRODUCT_IDS.PRO_ANNUAL_USD]: PlanTier.PRO,
  [DODO_PRODUCT_IDS.PRO_MONTHLY_INR]: PlanTier.PRO,
  [DODO_PRODUCT_IDS.PRO_ANNUAL_INR]: PlanTier.PRO,
};

export function getDodoProductId(
  period: BillingPeriod,
  currency: CurrencyCode.USD | CurrencyCode.INR = CurrencyCode.USD,
): string | null {
  if (currency === CurrencyCode.INR) {
    if (period === BillingPeriod.ANNUAL) return DODO_PRODUCT_IDS.PRO_ANNUAL_INR || null;
    return DODO_PRODUCT_IDS.PRO_MONTHLY_INR || null;
  }
  if (period === BillingPeriod.ANNUAL) return DODO_PRODUCT_IDS.PRO_ANNUAL_USD || null;
  return DODO_PRODUCT_IDS.PRO_MONTHLY_USD || null;
}
