import { classifyLocation } from '@/lib/ats/location-normalizer';
import { extractSkillsFromText } from '@/lib/ats/skill-extractor';
import { detectVisaSponsorship } from '@/lib/ats/visa-extractor';
import { stripHtml } from '@/lib/utils';

export interface NormalizedJob {
  atsSource: string;
  atsSourceId: string;
  title: string;
  description: string;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  workType: 'REMOTE' | 'HYBRID' | 'ONSITE';
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  experienceLevel: string | null;
  category: string | null;
  location: string;
  locationClass: 'worldwide' | 'us-only' | 'emea' | 'india' | 'onsite';
  companyName: string;
  companyLogoUrl: string | null;
  companyWebsite: string;
  externalApplyUrl: string;
  skillMatches: string[];
  visaSponsored: boolean;
  publishedAt: string;
}

interface AshbyJob {
  id: string;
  title: string;
  publishedDate: string;
  descriptionHtml?: string;
  isRemote?: boolean;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  employmentType?: string;
  departmentName?: string;
  applyUrl?: string;
}

export async function normalizeAshbyJob(
  raw: AshbyJob,
  companyName: string,
  companyWebsite: string,
  companyLogoUrl: string | null,
  skills: Array<{ id: string; name: string; aliases: string[] }>,
): Promise<NormalizedJob> {
  const description = stripHtml(raw.descriptionHtml || '');
  const locationStr = raw.location || 'Remote';

  const classified = classifyLocation({
    location: locationStr,
    isRemote: raw.isRemote,
    workplaceType: raw.isRemote ? 'Remote' : undefined,
  });

  const jobType = mapAshbyEmploymentType(raw.employmentType);
  const allText = `${raw.title} ${description}`;
  const skillMatches = extractSkillsFromText(allText, skills);
  const visaSponsored = detectVisaSponsorship(description);

  return {
    atsSource: 'ashby',
    atsSourceId: raw.id,
    title: raw.title,
    description,
    jobType,
    workType: classified.workType,
    salaryMin: raw.salaryMin ?? null,
    salaryMax: raw.salaryMax ?? null,
    currency: raw.currency ?? null,
    experienceLevel: null,
    category: raw.departmentName ?? null,
    location: locationStr,
    locationClass: classified.locationClass,
    companyName,
    companyLogoUrl,
    companyWebsite,
    externalApplyUrl: raw.applyUrl || `https://jobs.ashbyhq.com/${companyName.toLowerCase().replace(/\s+/g, '')}`,
    skillMatches,
    visaSponsored,
    publishedAt: raw.publishedDate,
  };
}

export async function fetchAshbyJobs(
  boardToken: string,
  companyName: string,
  companyWebsite: string,
  companyLogoUrl: string | null,
  skills: Array<{ id: string; name: string; aliases: string[] }>,
): Promise<NormalizedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${boardToken}?includeCompensation=true`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Hiretivo/1.0' } });

  if (!res.ok) {
    console.error(`[ashby] ${companyName}: HTTP ${res.status}`);
    return [];
  }

  const data = await res.json();
  const jobs: AshbyJob[] = data.jobs || data.nodes || [];

  return Promise.all(
    jobs.map((j) => normalizeAshbyJob(j, companyName, companyWebsite, companyLogoUrl, skills)),
  );
}

function mapAshbyEmploymentType(type?: string): NormalizedJob['jobType'] {
  if (!type) return 'FULL_TIME';
  const t = type.toLowerCase();
  if (t.includes('part')) return 'PART_TIME';
  if (t.includes('contract') || t.includes('temporary')) return 'CONTRACT';
  if (t.includes('intern')) return 'INTERNSHIP';
  return 'FULL_TIME';
}
