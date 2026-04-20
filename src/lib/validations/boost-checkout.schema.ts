import { z } from 'zod';

export const BoostCheckoutSchema = z.object({
  jobId: z.string().min(1).max(100),
});

export type BoostCheckoutInput = z.infer<typeof BoostCheckoutSchema>;
