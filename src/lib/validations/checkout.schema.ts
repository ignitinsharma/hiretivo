import { z } from "zod";

export const CheckoutRequestSchema = z.object({
  planId: z.enum(["pro"]),
  period: z.enum(["monthly", "annual"]),
  currency: z.enum(["USD", "INR"]).default("USD"),
});

export type CheckoutRequestInput = z.infer<typeof CheckoutRequestSchema>;
