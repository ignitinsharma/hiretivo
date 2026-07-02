import type { WorkType, LocationClass, JobType, ExperienceBand } from '@/constants/enums';
import type { JobListItem } from '@/modules/jobs/types/job.types';

/* FeedFilters — client-side feed filter state, mirrored to the URL and to feedFilterSchema. */
export interface FeedFilters {
  search?: string;
  workType?: WorkType;
  locationClass?: LocationClass;
  companies?: string[];
  experienceMax?: ExperienceBand;
  role?: string;
  visaSponsored?: boolean;
  employmentType?: JobType;
}

/* FeedJobItem — feed card shape. Extends JobListItem with feed-only stale flags. */
export interface FeedJobItem extends JobListItem {
  isStale?: boolean;      // publishedAt older than STALE_JOB_DAYS
  mayBeClosed?: boolean;  // stale + heuristic
  publishedAtIso?: string | null;
  locationClass?: string | null;
  visaSponsored?: boolean;
}
