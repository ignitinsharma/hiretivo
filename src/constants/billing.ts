import { PlanTier } from "@/constants/enums";

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
  period: "monthly" | "annual",
  currency: "USD" | "INR" = "USD",
): string | null {
  if (currency === "INR") {
    if (period === "annual") return DODO_PRODUCT_IDS.PRO_ANNUAL_INR || null;
    return DODO_PRODUCT_IDS.PRO_MONTHLY_INR || null;
  }
  if (period === "annual") return DODO_PRODUCT_IDS.PRO_ANNUAL_USD || null;
  return DODO_PRODUCT_IDS.PRO_MONTHLY_USD || null;
}
