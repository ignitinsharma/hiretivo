import { WorkType, LocationClass, JobType, EXPERIENCE_BAND_VALUES } from '@/constants/enums';

/* Typed filter option config — rendered via .map() in FeedFilterBar (DRY, no copy-pasted selects). */
export const WORKPLACE_OPTIONS = [
  { value: WorkType.REMOTE, label: 'Remote' },
  { value: WorkType.HYBRID, label: 'Hybrid' },
  { value: WorkType.ONSITE, label: 'On-site' },
] as const;

export const LOCATION_OPTIONS = [
  { value: LocationClass.WORLDWIDE, label: 'Worldwide' },
  { value: LocationClass.US_ONLY, label: 'US only' },
  { value: LocationClass.EMEA, label: 'EMEA' },
  { value: LocationClass.INDIA, label: 'India' },
  { value: LocationClass.ONSITE, label: 'On-site' },
] as const;

export const EMPLOYMENT_OPTIONS = [
  { value: JobType.FULL_TIME, label: 'Full-time' },
  { value: JobType.PART_TIME, label: 'Part-time' },
  { value: JobType.CONTRACT, label: 'Contract' },
  { value: JobType.INTERNSHIP, label: 'Internship' },
] as const;

export const EXPERIENCE_OPTIONS = EXPERIENCE_BAND_VALUES.map((b) => ({
  value: b,
  label: b.charAt(0).toUpperCase() + b.slice(1),
}));
