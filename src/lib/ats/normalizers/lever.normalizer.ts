import { classifyLocation } from '@/lib/ats/location-normalizer';
import { extractSkillsFromText } from '@/lib/ats/skill-extractor';
import { detectVisaSponsorship } from '@/lib/ats/visa-extractor';
import { stripHtml } from '@/lib/utils';
import type { NormalizedJob } from './ashby.normalizer';

interface LeverJob {
  id: string;
  text: string;
  state: string;
  categories: {
    location: string;
    commitment: string;
    team: string;
    department: string;
  };
  descriptionPlain: string;
  description: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
    interval: string;
  } | null;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
}

export async function fetchLeverJobs(
  boardToken: string,
  companyName: string,
  companyWebsite: string,
  companyLogoUrl: string | null,
  skills: Array<{ id: string; name: string }>,
): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${boardToken}?mode=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Hiretivo/1.0' } });

  if (!res.ok) {
    console.error(`[lever] ${companyName}: HTTP ${res.status}`);
    return [];
  }

  const data: LeverJob[] = await res.json();
  const jobs = Array.isArray(data) ? data : [];

  return jobs
    .filter((j) => j.state === 'published')
    .map((job) => normalizeLeverJob(job, companyName, companyWebsite, companyLogoUrl, skills));
}

export function normalizeLeverJob(
  job: LeverJob,
  companyName: string,
  companyWebsite: string,
  companyLogoUrl: string | null,
  skills: Array<{ id: string; name: string }>,
): NormalizedJob {
  const description = job.descriptionPlain || stripHtml(job.description || '');
  const locationStr = job.categories?.location || 'Remote';

  const classified = classifyLocation({
    location: locationStr,
  });

  const allText = `${job.text} ${description}`;
  const skillMatches = extractSkillsFromText(allText, skills);
  const visaSponsored = detectVisaSponsorship(description);

  const jobType = mapLeverCommitment(job.categories?.commitment);

  return {
    atsSource: 'lever',
    atsSourceId: job.id,
    title: job.text,
    description,
    jobType,
    workType: classified.workType,
    salaryMin: job.salaryRange?.min ?? null,
    salaryMax: job.salaryRange?.max ?? null,
    currency: job.salaryRange?.currency ?? null,
    experienceLevel: null,
    category: job.categories?.department ?? job.categories?.team ?? null,
    location: locationStr,
    locationClass: classified.locationClass,
    companyName,
    companyLogoUrl,
    companyWebsite,
    externalApplyUrl: job.applyUrl || job.hostedUrl,
    skillMatches,
    visaSponsored,
    publishedAt: new Date(job.createdAt).toISOString(),
  };
}

function mapLeverCommitment(commitment?: string): NormalizedJob['jobType'] {
  if (!commitment) return 'FULL_TIME';
  const t = commitment.toLowerCase();
  if (t.includes('part')) return 'PART_TIME';
  if (t.includes('contract')) return 'CONTRACT';
  if (t.includes('intern')) return 'INTERNSHIP';
  return 'FULL_TIME';
}
