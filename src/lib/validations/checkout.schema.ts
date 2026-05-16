import { z } from "zod";
import {
  BILLING_CURRENCY_VALUES,
  BILLING_PERIOD_VALUES,
  CurrencyCode,
  PlanTier,
} from "@/constants/enums";

export const CheckoutRequestSchema = z.object({
  planId: z.enum([PlanTier.STARTER, PlanTier.GROWTH, PlanTier.SCALE]),
  period: z.enum(BILLING_PERIOD_VALUES),
  currency: z.enum(BILLING_CURRENCY_VALUES).default(CurrencyCode.USD),
});

export type CheckoutRequestInput = z.infer<typeof CheckoutRequestSchema>;
