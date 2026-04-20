import { z } from 'zod';

// No request body for the ai-summary endpoint — the applicationId comes from URL params.
// This schema validates the URL param to prevent injection.
export const AiSummaryParamsSchema = z.object({
  id: z.string().min(1).max(100),
});
