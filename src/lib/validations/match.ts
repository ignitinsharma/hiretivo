import { z } from 'zod';
import { JOB_TYPE_VALUES, WORK_TYPE_VALUES, LOCATION_CLASS_VALUES, EXPERIENCE_LEVEL_VALUES } from '@/constants/enums';

export const feedFilterSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  jobType: z.enum(JOB_TYPE_VALUES).optional(),
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  location: z.string().optional(),
  recentOffset: z.coerce.number().min(0).optional(),
  locationClass: z.enum(LOCATION_CLASS_VALUES).optional(),
  visaSponsored: z.coerce.boolean().optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVEL_VALUES).optional(),
  q: z.string().optional(),
});
