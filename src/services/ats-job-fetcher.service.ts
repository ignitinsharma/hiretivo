import { prisma } from '@/lib/prisma';
import { COMPANY_REGISTRY } from '@/lib/ats/registry';
import { generateDedupeKey } from '@/lib/ats/deduplicator';
import { fetchAshbyJobs } from '@/lib/ats/normalizers/ashby.normalizer';
import { fetchGreenhouseJobs } from '@/lib/ats/normalizers/greenhouse.normalizer';
import { fetchLeverJobs } from '@/lib/ats/normalizers/lever.normalizer';
import { subHours, subDays } from 'date-fns';
import { SkillLevel, JobStatus } from '@/constants/enums';

const SYSTEM_USER_ID = 'system-ats-user';
const CHUNK_SIZE = 10;

function chunks<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

interface FetchResult {
  fetched: number;
  created: number;
  updated: number;
  closed: number;
  errors: number;
  newJobIds: string[];
}

export async function fetchAndUpsertAllJobs(): Promise<{
  ashby: { fetched: number; errors: number };
  greenhouse: { fetched: number; errors: number };
  lever: { fetched: number; errors: number };
  total: { created: number; updated: number; closed: number };
  errors: number;
}> {
  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true } });
  const blocklist = await prisma.atsBlocklist.findMany({ select: { companyName: true } });
  const blockedNames = new Set(blocklist.map((b) => b.companyName.toLowerCase()));

  const results = await Promise.all([
    fetchSource('ashby', blockedNames, allSkills),
    fetchSource('greenhouse', blockedNames, allSkills),
    fetchSource('lever', blockedNames, allSkills),
  ]);

  const allNewJobIds: string[] = [];
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const r of results) {
    totalCreated += r.created;
    totalUpdated += r.updated;
    totalErrors += r.errors;
    allNewJobIds.push(...r.newJobIds);
  }

  await recomputeJobMatchesForJobs(allNewJobIds);

  const { closedStale, closedOld } = await autoCloseStaleJobs();
  const totalClosed = closedStale + closedOld;

  return {
    ashby: { fetched: results[0].fetched, errors: results[0].errors },
    greenhouse: { fetched: results[1].fetched, errors: results[1].errors },
    lever: { fetched: results[2].fetched, errors: results[2].errors },
    total: { created: totalCreated, updated: totalUpdated, closed: totalClosed },
    errors: totalErrors,
  };
}

async function fetchSource(
  source: 'ashby' | 'greenhouse' | 'lever',
  blockedNames: Set<string>,
  allSkills: Array<{ id: string; name: string }>,
): Promise<FetchResult> {
  const companies = COMPANY_REGISTRY.filter((c) => c.ats === source);
  let totalFetched = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  const newJobIds: string[] = [];

  for (const chunk of chunks(companies, CHUNK_SIZE)) {
    const results = await Promise.allSettled(
      chunk.map(async (company) => {
        if (blockedNames.has(company.name.toLowerCase())) {
          return [];
        }

        let jobs;

        switch (source) {
          case 'ashby':
            jobs = await fetchAshbyJobs(company.boardToken, company.name, company.website, company.logoUrl || null, allSkills);
            break;
          case 'greenhouse':
            jobs = await fetchGreenhouseJobs(company.boardToken, company.name, company.website, company.logoUrl || null, allSkills);
            break;
          case 'lever':
            jobs = await fetchLeverJobs(company.boardToken, company.name, company.website, company.logoUrl || null, allSkills);
            break;
        }

        for (const job of jobs) {
          const { id, isNew } = await upsertJob(job, allSkills);
          if (isNew) {
            newJobIds.push(id);
            totalCreated++;
          } else {
            totalUpdated++;
          }
        }

        return jobs;
      }),
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        totalFetched += r.value.length;
      } else {
        totalErrors++;
        console.error(`[ats-fetch] ${source} chunk error:`, r.reason);
      }
    }
  }

  return { fetched: totalFetched, created: totalCreated, updated: totalUpdated, closed: 0, errors: totalErrors, newJobIds };
}

async function upsertJob(
  job: {
    atsSource: string;
    atsSourceId: string;
    title: string;
    description: string;
    jobType: string;
    workType: string;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string | null;
    experienceLevel: string | null;
    category: string | null;
    location: string;
    locationClass: string;
    companyName: string;
    companyLogoUrl: string | null;
    companyWebsite: string;
    externalApplyUrl: string;
    skillMatches: string[];
    visaSponsored: boolean;
    publishedAt: string;
  },
  allSkills: Array<{ id: string; name: string }>,
): Promise<{ id: string; isNew: boolean }> {
  const dedupeKey = generateDedupeKey(job.companyName, job.title, job.atsSourceId);
  const publishedAt = job.publishedAt ? new Date(job.publishedAt) : new Date();
  const now = new Date();

  const existing = await prisma.job.findUnique({ where: { dedupeKey }, select: { id: true } });

  const upserted = await prisma.job.upsert({
    where: { dedupeKey },
    create: {
      recruiterId: SYSTEM_USER_ID,
      title: job.title,
      description: job.description || 'No description provided',
      jobType: job.jobType as any,
      applyType: 'EXTERNAL',
      workType: job.workType as any,
      status: JobStatus.OPEN,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      experienceLevel: job.experienceLevel,
      category: job.category,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      companyWebsite: job.companyWebsite,
      isAdminPosted: true,
      externalApplyUrl: job.externalApplyUrl,
      publishedAt,
      atsSource: job.atsSource,
      atsSourceId: job.atsSourceId,
      dedupeKey,
      lastSeenAt: now,
      location: job.location,
      locationClass: job.locationClass,
      visaSponsored: job.visaSponsored,
    },
    update: {
      title: job.title,
      description: job.description || 'No description provided',
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      experienceLevel: job.experienceLevel,
      category: job.category,
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      companyWebsite: job.companyWebsite,
      externalApplyUrl: job.externalApplyUrl,
      publishedAt,
      lastSeenAt: now,
      location: job.location,
      locationClass: job.locationClass,
      visaSponsored: job.visaSponsored,
    },
    select: { id: true },
  });

  await upsertJobSkills(upserted.id, job.skillMatches, allSkills);

  return { id: upserted.id, isNew: !existing };
}

async function upsertJobSkills(
  jobId: string,
  skillNames: string[],
  allSkills: Array<{ id: string; name: string }>,
): Promise<void> {
  if (skillNames.length === 0) return;

  const skillMap = new Map(allSkills.map((s) => [s.name, s.id]));
  const skillIds = skillNames
    .map((name) => skillMap.get(name))
    .filter((id): id is string => id !== undefined);

  if (skillIds.length === 0) return;

  await prisma.jobSkill.deleteMany({ where: { jobId } });

  await prisma.jobSkill.createMany({
    data: skillIds.map((skillId) => ({
      jobId,
      skillId,
      level: SkillLevel.INTERMEDIATE,
    })),
    skipDuplicates: true,
  });
}

async function recomputeJobMatchesForJobs(jobIds: string[]): Promise<void> {
  for (const jobId of jobIds) {
    const jobSkills = await prisma.jobSkill.findMany({
      where: { jobId },
      select: { skillId: true },
    });

    if (jobSkills.length === 0) continue;

    const jobSkillIds = jobSkills.map((js) => js.skillId);

    const seekerProfiles = await prisma.seekerProfile.findMany({
      where: {
        skills: { some: { skillId: { in: jobSkillIds } } },
      },
      select: {
        id: true,
        skills: { select: { skillId: true } },
      },
    });

    for (const seeker of seekerProfiles) {
      const seekerSkillIds = new Set(seeker.skills.map((s) => s.skillId));
      const intersection = jobSkillIds.filter((id) => seekerSkillIds.has(id)).length;
      const score = Math.round((intersection / jobSkillIds.length) * 100);

      if (score === 0) continue;

      await prisma.jobMatch.upsert({
        where: { jobId_seekerProfileId: { jobId, seekerProfileId: seeker.id } },
        create: { jobId, seekerProfileId: seeker.id, score },
        update: { score },
      });
    }
  }
}

async function autoCloseStaleJobs(): Promise<{ closedStale: number; closedOld: number }> {
  const { count: closedStale } = await prisma.job.updateMany({
    where: {
      isAdminPosted: true,
      status: JobStatus.OPEN,
      lastSeenAt: { lt: subHours(new Date(), 48) },
    },
    data: { status: JobStatus.CLOSED, closedAt: new Date() },
  });

  const { count: closedOld } = await prisma.job.updateMany({
    where: {
      isAdminPosted: true,
      status: JobStatus.OPEN,
      publishedAt: { lt: subDays(new Date(), 60) },
    },
    data: { status: JobStatus.CLOSED, closedAt: new Date() },
  });

  return { closedStale, closedOld };
}

export async function closeBlockedCompanyJobs(companyName: string): Promise<number> {
  const { count } = await prisma.job.updateMany({
    where: {
      isAdminPosted: true,
      status: JobStatus.OPEN,
      companyName: { equals: companyName, mode: 'insensitive' },
    },
    data: { status: JobStatus.CLOSED, closedAt: new Date() },
  });
  return count;
}
