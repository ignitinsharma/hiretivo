import { z } from 'zod';
import { JOB_TYPE_VALUES, WORK_TYPE_VALUES } from '@/constants/enums';

export const feedFilterSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  jobType: z.enum(JOB_TYPE_VALUES).optional(),
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  location: z.string().optional(),
});
