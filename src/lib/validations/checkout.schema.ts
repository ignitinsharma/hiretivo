import { z } from "zod";
import {
  BILLING_PERIOD_VALUES,
  CurrencyCode,
  PricingTierId,
} from "@/constants/enums";

export const CheckoutRequestSchema = z.object({
  planId: z.enum([PricingTierId.STARTER, PricingTierId.GROWTH, PricingTierId.SCALE]),
  period: z.enum(BILLING_PERIOD_VALUES),
  currency: z.literal(CurrencyCode.USD).default(CurrencyCode.USD),
});

export type CheckoutRequestInput = z.infer<typeof CheckoutRequestSchema>;
