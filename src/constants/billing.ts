import { PlanTier } from "@/constants/enums";

export const DODO_PRODUCT_IDS = {
  PRO_MONTHLY: process.env.DODO_PRO_MONTHLY_PRODUCT_ID ?? "",
  PRO_ANNUAL: process.env.DODO_PRO_ANNUAL_PRODUCT_ID ?? "",
} as const;

export const DODO_PRODUCT_TO_PLAN: Record<string, PlanTier> = {
  [DODO_PRODUCT_IDS.PRO_MONTHLY]: PlanTier.PRO,
  [DODO_PRODUCT_IDS.PRO_ANNUAL]: PlanTier.PRO,
};

export function getDodoProductId(period: "monthly" | "annual"): string | null {
  if (period === "annual") return DODO_PRODUCT_IDS.PRO_ANNUAL || null;
  return DODO_PRODUCT_IDS.PRO_MONTHLY || null;
}
