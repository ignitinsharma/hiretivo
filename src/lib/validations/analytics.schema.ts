import { z } from 'zod';

// Validates the dynamic [id] URL param
export const AnalyticsParamsSchema = z.object({
  id: z.string().min(1).max(100),
});
