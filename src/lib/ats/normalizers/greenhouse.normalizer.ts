import { classifyLocation } from '@/lib/ats/location-normalizer';
import { extractSkillsFromText } from '@/lib/ats/skill-extractor';
import { detectVisaSponsorship } from '@/lib/ats/visa-extractor';
import { stripHtml } from '@/lib/utils';
import type { NormalizedJob } from './ashby.normalizer';

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  departments?: Array<{ name: string }>;
  offices?: Array<{ name: string; location?: string }>;
  metadata?: Array<{ id: number; name: string; value: string }>;
  updated_at: string;
  absolute_url: string;
  content: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function fetchGreenhouseJobs(
  boardToken: string,
  companyName: string,
  companyWebsite: string,
  companyLogoUrl: string | null,
  skills: Array<{ id: string; name: string; aliases: string[] }>,
): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Hiretivo/1.0' } });

  if (!res.ok) {
    console.error(`[greenhouse] ${companyName}: HTTP ${res.status}`);
    return [];
  }

  const data: GreenhouseResponse = await res.json();
  const jobs = data.jobs || [];

  return jobs.map((job) => normalizeGreenhouseJob(job, companyName, companyWebsite, companyLogoUrl, skills));
}

export function normalizeGreenhouseJob(
  job: GreenhouseJob,
  companyName: string,
  companyWebsite: string,
  companyLogoUrl: string | null,
  skills: Array<{ id: string; name: string; aliases: string[] }>,
): NormalizedJob {
  const locationStr = job.location?.name || 'Remote';
  const description = stripHtml(job.content || '');

  const classified = classifyLocation({
    location: locationStr,
  });

  const allText = `${job.title} ${description}`;
  const skillMatches = extractSkillsFromText(allText, skills);
  const visaSponsored = detectVisaSponsorship(description);

  return {
    atsSource: 'greenhouse',
    atsSourceId: String(job.id),
    title: job.title,
    description,
    jobType: 'FULL_TIME',
    workType: classified.workType,
    salaryMin: null,
    salaryMax: null,
    currency: null,
    experienceLevel: null,
    category: job.departments?.[0]?.name ?? null,
    location: locationStr,
    locationClass: classified.locationClass,
    companyName,
    companyLogoUrl,
    companyWebsite,
    externalApplyUrl: job.absolute_url,
    skillMatches,
    visaSponsored,
    publishedAt: job.updated_at,
  };
}
