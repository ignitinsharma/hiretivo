import { LocationClass, WorkType } from '@/constants/enums';

/*
 * classifyLocation
 * Classifies a job's location into a WorkType and LocationClass based on
 * location string, workplace type, and remote flag.
 *
 * @param job - object with isRemote flag, location string, and optional workplaceType
 * @returns workType (REMOTE/HYBRID/ONSITE), locationClass, and displayLocation string
 *
 * Key behaviours:
 * - Bare "Remote" string → WORLDWIDE
 * - Explicit worldwide/global/anywhere text → WORLDWIDE
 * - US-region + remote signal → US_ONLY
 * - EMEA cities/regions + remote signal → EMEA
 * - India cities (with or without remote) → INDIA (isRemote flag does NOT upgrade to WORLDWIDE)
 * - Remaining isRemote/Remote workplace → WORLDWIDE
 * - Hybrid workplace → ONSITE class
 * - Everything else → ONSITE
 */
export function classifyLocation(job: {
  isRemote?: boolean;
  location: string;
  workplaceType?: string;
}): { workType: WorkType; locationClass: LocationClass; displayLocation: string } {
  const loc = job.location.trim();
  const combined = `${loc} ${job.workplaceType || ''}`.toLowerCase().trim();

  /* Exact "Remote" location string — worldwide by default */
  if (/^remote$/i.test(loc)) {
    return { workType: WorkType.REMOTE, locationClass: LocationClass.WORLDWIDE, displayLocation: 'Remote (Worldwide)' };
  }

  if (/worldwide|global|anywhere|remote[-\s]?(ok|friendly|first)/i.test(combined)) {
    return { workType: WorkType.REMOTE, locationClass: LocationClass.WORLDWIDE, displayLocation: 'Remote (Worldwide)' };
  }

  if (
    (/\bUS\b|united states|\bUSA\b/i.test(combined) && !/worldwide|global|anywhere/i.test(combined))
    && (combined.includes('remote') || job.isRemote === true || job.workplaceType === 'Remote')
  ) {
    return { workType: WorkType.REMOTE, locationClass: LocationClass.US_ONLY, displayLocation: 'Remote (US Only)' };
  }

  if (
    /EMEA|europe|\bUK\b|London|Berlin|Paris|Amsterdam|Dublin|Stockholm|Copenhagen/i.test(combined)
    && (combined.includes('remote') || job.isRemote === true)
  ) {
    return { workType: WorkType.REMOTE, locationClass: LocationClass.EMEA, displayLocation: 'Remote (EMEA)' };
  }

  /* India cities — isRemote=true does NOT promote to WORLDWIDE; always INDIA class */
  if (
    /bangalore|bengaluru|hyderabad|pune|mumbai|chennai|gurgaon|gurugram|noida|delhi|kolkata|ahmedabad|india/i.test(combined)
  ) {
    if (combined.includes('remote') || job.workplaceType === 'Remote') {
      return { workType: WorkType.REMOTE, locationClass: LocationClass.INDIA, displayLocation: `Remote (${loc})` };
    }
    return { workType: WorkType.ONSITE, locationClass: LocationClass.INDIA, displayLocation: loc };
  }

  if (job.isRemote === true || job.workplaceType === 'Remote') {
    return { workType: WorkType.REMOTE, locationClass: LocationClass.WORLDWIDE, displayLocation: 'Remote' };
  }

  if (job.workplaceType === 'Hybrid') {
    return { workType: WorkType.HYBRID, locationClass: LocationClass.ONSITE, displayLocation: loc };
  }

  return { workType: WorkType.ONSITE, locationClass: LocationClass.ONSITE, displayLocation: loc };
}
