import { z } from 'zod';
import {
  JOB_TYPE_VALUES,
  WORK_TYPE_VALUES,
  LOCATION_CLASS_VALUES,
  EXPERIENCE_BAND_VALUES,
} from '@/constants/enums';

/* feedFilterSchema
 * Validates seeker feed query params (client + server). All fields optional except paging defaults.
 * `companies` arrives as a comma-joined string and is split to a trimmed non-empty array. */
export const feedFilterSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  recentOffset: z.coerce.number().min(0).optional(),
  // Free-text search across title + description
  search: z.string().trim().max(100).optional(),
  // Workplace (REMOTE/HYBRID/ONSITE)
  workType: z.enum(WORK_TYPE_VALUES).optional(),
  // Location class (worldwide/us-only/emea/india/onsite)
  locationClass: z.enum(LOCATION_CLASS_VALUES).optional(),
  // Comma-joined company names → array
  companies: z
    .string()
    .optional()
    .transform((v) =>
      v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    ),
  // Max experience band the seeker will consider
  experienceMax: z.enum(EXPERIENCE_BAND_VALUES).optional(),
  // Role bucket → Job.category
  role: z.string().trim().max(80).optional(),
  // Sponsors visa
  visaSponsored: z.coerce.boolean().optional(),
  // Employment type → Job.jobType (FULL_TIME/PART_TIME/CONTRACT/INTERNSHIP)
  employmentType: z.enum(JOB_TYPE_VALUES).optional(),
  // Legacy alias kept for backward compat with existing callers
  jobType: z.enum(JOB_TYPE_VALUES).optional(),
  location: z.string().optional(),
});
export type FeedFilterInput = z.input<typeof feedFilterSchema>;
export type FeedFilterParsed = z.output<typeof feedFilterSchema>;
