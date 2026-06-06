import { z } from "zod";
import {
  BILLING_PERIOD_VALUES,
  CurrencyCode,
  PricingTierId,
} from "@/constants/enums";
import { isAllowedCheckoutReturnTo } from "@/lib/billing/checkout-return";

export const CheckoutRequestSchema = z.object({
  planId: z.enum([PricingTierId.STARTER, PricingTierId.GROWTH, PricingTierId.SCALE]),
  period: z.enum(BILLING_PERIOD_VALUES),
  currency: z.literal(CurrencyCode.USD).default(CurrencyCode.USD),
  returnTo: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().trim().refine(isAllowedCheckoutReturnTo).optional(),
    ),
});

export type CheckoutRequestInput = z.infer<typeof CheckoutRequestSchema>;

/*
 * ChangePlanRequestSchema
 * Validates a request to change the current user's subscription plan.
 * Only paid plans are accepted — FREE and custom plans are excluded.
 * Direction (upgrade/downgrade) is always computed server-side from the DB.
 */
export const ChangePlanRequestSchema = z.object({
  planId: z.enum([PricingTierId.STARTER, PricingTierId.GROWTH, PricingTierId.SCALE]),
});

export type ChangePlanRequestInput = z.infer<typeof ChangePlanRequestSchema>;
