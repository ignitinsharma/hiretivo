import { z } from 'zod';

export const feedFilterSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  jobType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  workType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  location: z.string().optional(),
});
