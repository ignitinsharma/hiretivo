import { prisma } from '@/lib/prisma';
import { COMPANY_REGISTRY } from '@/lib/ats/registry';
import { generateDedupeKey } from '@/lib/ats/deduplicator';
import { fetchAshbyJobs } from '@/lib/ats/normalizers/ashby.normalizer';
import { fetchGreenhouseJobs } from '@/lib/ats/normalizers/greenhouse.normalizer';
import { fetchLeverJobs } from '@/lib/ats/normalizers/lever.normalizer';
import { computeDescriptionHash, meetsQualityBar } from '@/lib/ats/filters';
import { subHours, subDays } from 'date-fns';
import { SkillLevel, JobStatus, AtsSource } from '@/constants/enums';
import { WorkType, JobType } from '@prisma/client';
import { extractCandidateSkillsFromJD, reconcileAndInsertSkills } from '@/lib/ai/skill-catalog-extractor';

const SYSTEM_USER_ID = 'system-ats-user';
const COMPANY_CHUNK_SIZE = 10;

/*
 * upsertJobSkillIds
 * Maps extracted skill names to DB skill IDs using the full skill catalogue.
 * Returns only IDs that exist in the catalogue — unknown names are silently dropped.
 * @param skillNames - skill names from the normalizer's skillMatches array
 * @param allSkills  - full skill catalogue fetched once per cron run
 * @returns array of skill IDs ready for JobSkill.createMany
 */
export function upsertJobSkillIds(
  skillNames: string[],
  allSkills: Array<{ id: string; name: string; aliases: string[] }>,
): string[] {
  if (skillNames.length === 0) return [];
  const nameMap = new Map(allSkills.map((s) => [s.name, s.id]));
  const aliasMap = new Map<string, string>();
  for (const s of allSkills) {
    for (const a of s.aliases) aliasMap.set(a, s.id);
  }
  return skillNames
    .map((name) => nameMap.get(name) ?? aliasMap.get(name))
    .filter((id): id is string => id !== undefined);
}

/*
 * enrichJobSkills
 * Threshold-gated LLM enrichment: if deterministic skill extraction found fewer
 * than 3 skills for a job, runs LLM extraction to find missing catalog terms,
 * creates/aliases them in the DB, and pushes the new skill names into
 * job.skillMatches so they get linked as JobSkill rows.
 */
async function enrichJobSkills(
  job: NormalizedJob,
  allSkills: Array<{ id: string; name: string; aliases: string[] }>,
): Promise<void> {
  if (job.skillMatches.length >= 3) return;

  const candidates = await extractCandidateSkillsFromJD(job.description);
  if (candidates.length === 0) return;

  const result = await reconcileAndInsertSkills(candidates);

  for (const created of result.created) {
    allSkills.push({ id: created.id, name: created.name, aliases: [] });
    job.skillMatches.push(created.name);
  }

  for (const added of result.aliasesAdded) {
    const skill = allSkills.find((s) => s.name === added.skillName);
    if (skill && !skill.aliases.includes(added.alias)) {
      skill.aliases.push(added.alias);
    }
  }

  if (result.created.length > 0 || result.aliasesAdded.length > 0) {
    console.log(
      `[ats-fetch] Catalog enrichment for ${job.companyName}/${job.title}: ${result.created.length} new, ${result.aliasesAdded.length} aliases, ${result.rejected.length} rejected`,
    );
  }
}

/*
 * chunks
 * Splits an array into smaller arrays of the given size.
 * @param arr - source array
 * @param size - chunk size
 * @returns array of sub-arrays
 */
function chunks<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

interface NormalizedJob {
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
}

/*
 * fetchAndUpsertAllJobs
 * Master entry point: fetches all jobs from Ashby, Greenhouse, and Lever in parallel,
 * upserts them, recomputes job matches for new/reopened jobs, and auto-closes stale ones.
 * @returns per-source and total counters
 */
export async function fetchAndUpsertAllJobs(): Promise<{
  ashby: { fetched: number; errors: number };
  greenhouse: { fetched: number; errors: number };
  lever: { fetched: number; errors: number };
  total: { created: number; updated: number; closed: number };
  errors: number;
}> {
  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true, aliases: true } });
  const blocklist = await prisma.atsBlocklist.findMany({ select: { companyName: true } });
  const blockedNames = new Set(blocklist.map((b) => b.companyName.toLowerCase()));

  const sources = [AtsSource.ASHBY, AtsSource.GREENHOUSE, AtsSource.LEVER] as const;
  const results = await Promise.all(
    sources.map((src) => fetchAndUpsertSource(src, blockedNames, allSkills)),
  );

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

  // Auto-close per source so each source only closes its own stale/old jobs.
  let totalClosed = 0;
  for (let i = 0; i < sources.length; i++) {
    const { closedStale, closedOld } = await autoCloseStaleJobs(sources[i], results[i].companyErrors);
    totalClosed += closedStale + closedOld;
  }

  return {
    ashby: { fetched: results[0].fetched, errors: results[0].errors },
    greenhouse: { fetched: results[1].fetched, errors: results[1].errors },
    lever: { fetched: results[2].fetched, errors: results[2].errors },
    total: { created: totalCreated, updated: totalUpdated, closed: totalClosed },
    errors: totalErrors,
  };
}

export { AtsSource as FetchSourceType };

/*
 * fetchAndAutoClose
 * Fetches and upserts jobs for a single ATS source, recomputes matches, then auto-closes stale jobs.
 * Used by per-source cron endpoints.
 * @param source - ATS source identifier
 * @returns per-source counters including total closed
 */
export async function fetchAndAutoClose(source: AtsSource): Promise<{
  source: string;
  fetched: number;
  created: number;
  updated: number;
  closed: number;
  errors: number;
}> {
  const allSkills = await prisma.skill.findMany({ select: { id: true, name: true, aliases: true } });
  const blocklist = await prisma.atsBlocklist.findMany({ select: { companyName: true } });
  const blockedNames = new Set(blocklist.map((b) => b.companyName.toLowerCase()));

  const result = await fetchAndUpsertSource(source, blockedNames, allSkills);
  await recomputeJobMatchesForJobs(result.newJobIds);

  // Scope stale-close to this source only — prevents Ashby cron from closing Greenhouse/Lever
  // jobs that haven't been refreshed by their own cron yet (runs at +15min and +30min offsets).
  const { closedStale, closedOld } = await autoCloseStaleJobs(source, result.companyErrors);
  const totalClosed = closedStale + closedOld;

  return {
    source,
    fetched: result.fetched,
    created: result.created,
    updated: result.updated,
    closed: totalClosed,
    errors: result.errors,
  };
}

/*
 * fetchAndUpsertSource
 * Fetches all jobs from one ATS source, filters to quality tech roles,
 * deduplicates against existing DB records, creates/updates/reopens jobs, and returns counters.
 * companyErrors tracks API failures so callers can skip stale-close for those companies.
 * @param source - 'ashby' | 'greenhouse' | 'lever'
 * @param blockedNames - set of lowercased company names to skip
 * @param allSkills - full skill catalogue from DB
 * @returns fetched/created/updated/errors counts, new job IDs, and per-company error map
 */
async function fetchAndUpsertSource(
  source: AtsSource,
  blockedNames: Set<string>,
  allSkills: Array<{ id: string; name: string; aliases: string[] }>,
): Promise<{ fetched: number; created: number; updated: number; errors: number; newJobIds: string[]; companyErrors: Map<string, number> }> {
  const companies = COMPANY_REGISTRY.filter((c) => c.ats === source);
  const allJobs: NormalizedJob[] = [];
  let totalErrors = 0;

  // Phase 1: Fetch all jobs from APIs in parallel chunks with error tracking
  const companyErrors = new Map<string, number>();
  const companyZeroJobs = new Set<string>();

  for (const chunk of chunks(companies, COMPANY_CHUNK_SIZE)) {
    const results = await Promise.allSettled(
      chunk.map(async (company) => {
        if (blockedNames.has(company.name.toLowerCase())) return [];
        const fetcher =
          source === AtsSource.ASHBY
            ? fetchAshbyJobs
            : source === AtsSource.GREENHOUSE
              ? fetchGreenhouseJobs
              : fetchLeverJobs;
        return fetcher(company.boardToken, company.name, company.website, company.logoUrl || null, allSkills);
      }),
    );

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const companyName = chunk[i].name;
      if (r.status === 'fulfilled') {
        // Cap to 5 most recent per company — sorted by publishedAt desc (API returns newest first).
        // Prevents large boards (GitLab, Stripe) from flooding the feed.
        const jobs = r.value.slice(0, 5);
        if (jobs.length === 0 && !companyZeroJobs.has(companyName)) {
          companyZeroJobs.add(companyName);
          console.warn(`[ats-fetch] ${source} ${companyName} returned 0 jobs`);
        }
        allJobs.push(...jobs);
      } else {
        companyErrors.set(companyName, (companyErrors.get(companyName) || 0) + 1);
        totalErrors++;
        console.error(`[ats-fetch] ${source} ${companyName} error:`, r.reason);
      }
    }
  }

  // Phase 1.5: Filter to software/tech roles only
  const filteredJobs = allJobs.filter((job) => {
    const skillNames = job.skillMatches;
    return meetsQualityBar(
      job.title,
      job.description,
      job.category,
      skillNames,
      job.locationClass,
      job.jobType,
      job.visaSponsored,
    );
  });

  console.log(`[ats-fetch] ${source}: ${allJobs.length} raw → ${filteredJobs.length} after quality filter`);

  // Phase 2: Batch dedupe — find which filtered jobs already exist
  const now = new Date();
  const dedupeKeys = filteredJobs.map((j) => generateDedupeKey(j.companyName, j.title, j.atsSourceId));
  const existingKeys = new Set(
    (
      await prisma.job.findMany({
        where: { dedupeKey: { in: dedupeKeys } },
        select: { dedupeKey: true },
      })
    )
      .map((j) => j.dedupeKey)
      .filter(Boolean),
  );

  // Phase 3: Batch-prefetch closed jobs and existing job details to avoid N+1 queries

  // 3a: Batch-fetch all potentially-closed jobs (new job candidates not in existingKeys)
  const newJobCandidates = filteredJobs.filter((_, i) => !existingKeys.has(dedupeKeys[i]));
  const closedJobLookup = new Map<string, { id: string; descriptionHash: string | null }>();

  if (newJobCandidates.length > 0) {
    const closed = await prisma.job.findMany({
      where: {
        status: JobStatus.CLOSED,
        companyName: { in: [...new Set(newJobCandidates.map((j) => j.companyName))] },
      },
      select: { id: true, companyName: true, title: true, descriptionHash: true },
    });
    for (const c of closed) {
      if (!c.companyName) continue;
      closedJobLookup.set(`${c.companyName.toLowerCase()}|${c.title}`, {
        id: c.id,
        descriptionHash: c.descriptionHash,
      });
    }
  }

  // 3b: Batch-fetch existing job details for descriptionHash comparison
  const existingJobDetails = new Map<string, { id: string; descriptionHash: string | null }>();

  // Collect existing dedupe keys with a direct indexed loop — avoids O(n²) indexOf
  const existingDedupeKeys: string[] = [];
  for (let i = 0; i < filteredJobs.length; i++) {
    if (existingKeys.has(dedupeKeys[i])) {
      existingDedupeKeys.push(dedupeKeys[i]);
    }
  }

  if (existingDedupeKeys.length > 0) {
    const existing = await prisma.job.findMany({
      where: { dedupeKey: { in: existingDedupeKeys } },
      select: { id: true, dedupeKey: true, descriptionHash: true },
    });
    for (const e of existing) {
      if (e.dedupeKey) {
        existingJobDetails.set(e.dedupeKey, { id: e.id, descriptionHash: e.descriptionHash });
      }
    }
  }

  // Phase 3: Create new jobs + reopen closed ones
  const newJobIds: string[] = [];
  let reopenedCount = 0;

  for (let i = 0; i < filteredJobs.length; i++) {
    const job = filteredJobs[i];
    const key = dedupeKeys[i];
    const descriptionHash = computeDescriptionHash({
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      workType: job.workType,
    });

    if (!existingKeys.has(key)) {
      // Check prefetched closed-job lookup for same company+title (reopened job)
      const closedKey = `${job.companyName.toLowerCase()}|${job.title}`;
      const existingClosed = closedJobLookup.get(closedKey);

      if (existingClosed) {
        // Reopen the closed job — refresh description + re-write skills
        reopenedCount++;
        await prisma.job.update({
          where: { id: existingClosed.id },
          data: {
            status: JobStatus.OPEN,
            publishedAt: now,
            lastSeenAt: now,
            description: job.description,
            descriptionHash,
            location: job.location,
            locationClass: job.locationClass,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: job.currency,
            experienceLevel: job.experienceLevel,
            category: job.category,
            externalApplyUrl: job.externalApplyUrl,
            visaSponsored: job.visaSponsored,
            workType: job.workType as WorkType,
            jobType: job.jobType as JobType,
            atsSourceId: job.atsSourceId,
            dedupeKey: key,
            companyLogoUrl: job.companyLogoUrl,
            companyWebsite: job.companyWebsite,
          },
        });
        // Re-write skills so JobMatch can be computed after reopen
        await prisma.jobSkill.deleteMany({ where: { jobId: existingClosed.id } });
        await enrichJobSkills(job, allSkills);
        const reopenSkillIds = upsertJobSkillIds(job.skillMatches, allSkills);
        if (reopenSkillIds.length > 0) {
          await prisma.jobSkill.createMany({
            data: reopenSkillIds.map((skillId) => ({ jobId: existingClosed.id, skillId, level: SkillLevel.INTERMEDIATE })),
            skipDuplicates: true,
          });
        }
        newJobIds.push(existingClosed.id);
      } else {
        // Create new job
        const created = await prisma.job.create({
          data: {
          title: job.title,
            description: job.description || 'No description provided',
            jobType: job.jobType as JobType,
            applyType: 'EXTERNAL',
            workType: job.workType as WorkType,
            status: JobStatus.OPEN,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: job.currency,
            experienceLevel: job.experienceLevel,
            category: job.category,
            companyName: job.companyName,
            companyLogoUrl: job.companyLogoUrl,
            companyWebsite: job.companyWebsite,
            externalApplyUrl: job.externalApplyUrl,
            publishedAt: job.publishedAt ? new Date(job.publishedAt) : now,
            atsSource: job.atsSource,
            atsSourceId: job.atsSourceId,
            dedupeKey: key,
            lastSeenAt: now,
            location: job.location,
            locationClass: job.locationClass,
            visaSponsored: job.visaSponsored,
            descriptionHash,
          },
        });
        // Write skills immediately so JobMatch can be computed right after
        await enrichJobSkills(job, allSkills);
        const newSkillIds = upsertJobSkillIds(job.skillMatches, allSkills);
        if (newSkillIds.length > 0) {
          await prisma.jobSkill.createMany({
            data: newSkillIds.map((skillId) => ({ jobId: created.id, skillId, level: SkillLevel.INTERMEDIATE })),
            skipDuplicates: true,
          });
        }
        newJobIds.push(created.id);
      }
    } else {
      // Existing job — check descriptionHash to see if content changed
      const existing = existingJobDetails.get(key);
      if (existing && existing.descriptionHash !== descriptionHash) {
        // Content changed — re-extract skills and update
        await prisma.jobSkill.deleteMany({ where: { jobId: existing.id } });
        await enrichJobSkills(job, allSkills);
        const updatedSkillIds = upsertJobSkillIds(job.skillMatches, allSkills);
        if (updatedSkillIds.length > 0) {
          await prisma.jobSkill.createMany({
            data: updatedSkillIds.map((skillId) => ({ jobId: existing.id, skillId, level: SkillLevel.INTERMEDIATE })),
            skipDuplicates: true,
          });
        }
        await prisma.job.update({
          where: { id: existing.id },
          data: {
            descriptionHash,
            description: job.description,
            location: job.location,
            locationClass: job.locationClass,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            visaSponsored: job.visaSponsored,
            title: job.title,
          },
        });
      }
    }
  }

  // Phase 4: Batch update lastSeenAt for existing jobs — skip companies with API errors
  let updated = 0;
  const safeDedupeKeys = dedupeKeys.filter((_, i) => {
    const company = filteredJobs[i];
    return company && !companyErrors.has(company.companyName);
  });

  if (safeDedupeKeys.length > 0) {
    const result = await prisma.job.updateMany({
      where: { dedupeKey: { in: safeDedupeKeys } },
      data: { lastSeenAt: now },
    });
    updated = result.count;
  }

  return {
    fetched: filteredJobs.length,
    created: newJobCandidates.length - reopenedCount,
    updated,
    errors: totalErrors,
    newJobIds,
    companyErrors,
  };
}

/*
 * recomputeJobMatchesForJobs
 * Recalculates match scores between newly created/reopened jobs and all seekers with overlapping skills.
 * Runs in parallel chunks to avoid overwhelming the DB.
 * @param jobIds - list of job IDs to recompute matches for
 */
async function recomputeJobMatchesForJobs(jobIds: string[]): Promise<void> {
  if (jobIds.length === 0) return;

  for (const chunk of chunks(jobIds, 10)) {
    await Promise.allSettled(
      chunk.map(async (jobId) => {
        const jobSkills = await prisma.jobSkill.findMany({
          where: { jobId },
          select: { skillId: true },
        });

        if (jobSkills.length === 0) return;

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
      }),
    );
  }
}

/*
 * autoCloseStaleJobs
 * Closes admin-posted jobs for a single ATS source that haven't been seen in 48h or were
 * published over 60 days ago. Scoped to `source` so Ashby's cron cannot close Greenhouse/Lever
 * jobs that haven't been refreshed by their own crons yet (staggered at +15m and +30m).
 * Skips companies that had API errors during the fetch to avoid false closures.
 * Cleans up orphaned JobSkill and JobMatch records for newly closed jobs.
 * @param source - ATS source to scope the close to
 * @param companyErrors - map of company names to error counts from the current fetch run
 * @returns counts of stale-closed and old-closed jobs
 */
async function autoCloseStaleJobs(
  source: AtsSource,
  companyErrors: Map<string, number>,
): Promise<{ closedStale: number; closedOld: number }> {
  const erroredCompanies = [...companyErrors.keys()];
  const now = new Date();

  const sourceFilter = { atsSource: source };

  // Pre-collect IDs before closing so orphan cleanup is reliable
  const staleIds = (await prisma.job.findMany({
    where: {
      status: JobStatus.OPEN,
      ...sourceFilter,
      lastSeenAt: { lt: subHours(now, 48) },
      ...(erroredCompanies.length > 0 ? { companyName: { notIn: erroredCompanies } } : {}),
    },
    select: { id: true },
  })).map(j => j.id);

  const staleIdSet = new Set(staleIds);

  const oldIds = (await prisma.job.findMany({
    where: {
      status: JobStatus.OPEN,
      ...sourceFilter,
      publishedAt: { lt: subDays(now, 60) },
      ...(erroredCompanies.length > 0 ? { companyName: { notIn: erroredCompanies } } : {}),
    },
    select: { id: true },
  })).map(j => j.id);

  // Exclude stale IDs from old batch to avoid double-counting in returned totals
  const uniqueOldIds = oldIds.filter(id => !staleIdSet.has(id));
  const allClosingIds = [...staleIds, ...uniqueOldIds];

  let closedStale = 0;
  let closedOld = 0;

  if (staleIds.length > 0) {
    const r = await prisma.job.updateMany({ where: { id: { in: staleIds } }, data: { status: JobStatus.CLOSED, closedAt: now } });
    closedStale = r.count;
  }
  if (uniqueOldIds.length > 0) {
    const r = await prisma.job.updateMany({ where: { id: { in: uniqueOldIds } }, data: { status: JobStatus.CLOSED, closedAt: now } });
    closedOld = r.count;
  }

  // Clean up orphaned skills/matches for just-closed jobs
  if (allClosingIds.length > 0) {
    await Promise.all([
      prisma.jobSkill.deleteMany({ where: { jobId: { in: allClosingIds } } }),
      prisma.jobMatch.deleteMany({ where: { jobId: { in: allClosingIds } } }),
    ]);
  }

  return { closedStale, closedOld };
}

/*
 * closeBlockedCompanyJobs
 * Closes all open admin-posted jobs for a company that has been added to the blocklist.
 * @param companyName - company name (case-insensitive match)
 * @returns count of jobs closed
 */
export async function closeBlockedCompanyJobs(companyName: string): Promise<number> {
  const { count } = await prisma.job.updateMany({
    where: {
      status: JobStatus.OPEN,
      companyName: { equals: companyName, mode: 'insensitive' },
    },
    data: { status: JobStatus.CLOSED, closedAt: new Date() },
  });
  return count;
}
