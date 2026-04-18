import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole, MatchThreshold } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { computeAllMatches, upsertJobMatches } from '@/lib/match';
import { feedFilterSchema } from '@/lib/validations/match';
import { createRateLimiter } from '@/lib/rate-limit';
import { getMissingSkillNames } from '@/lib/seeker-dashboard';

const feedRateLimiter = createRateLimiter("seeker-feed", 30, "1 m");

// Jobs below this match score receive an inline missing-skills explainer.
// Using MatchThreshold.GOOD (60) as the low-match threshold — seeker is unlikely
// to apply anyway so surfacing the gap is more helpful than hiding it.
const LOW_MATCH_THRESHOLD = MatchThreshold.GOOD;

// Max number of missing skill names shown inline to keep cards compact (D-10).
const MAX_HINT_SKILLS = 3;

function formatSalaryRange(min: number | null, max: number | null, currency: string | null): string {
  const cur = currency ?? 'USD';
  const symbol = cur === 'USD' ? '$' : cur === 'GBP' ? '£' : cur === 'EUR' ? '€' : '';
  if (!min && !max) return 'Not specified';
  const minStr = min ? `${symbol}${Math.round(min / 1000)}k` : '';
  const maxStr = max ? `${symbol}${Math.round(max / 1000)}k` : '';
  if (min && max) return `${minStr} – ${maxStr}`;
  return minStr || maxStr;
}

function formatPostedAt(date: Date | null): string {
  if (!date) return 'Recently';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate limiting — 30 feed requests/min
  const { success } = await feedRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      skills: { select: { skillId: true } },
    },
  });

  if (!seekerProfile) {
    return NextResponse.json({ jobs: [], nextCursor: null });
  }

  const parsed = feedFilterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid query params' }, { status: 400 });
  }

  const { cursor, limit, jobType, workType } = parsed.data;

  // Redis cache read-through
  const cacheKey = `match:${seekerProfile.id}`;
  let matches: { jobId: string; score: number }[];

  const cached = await redis.get(cacheKey);
  if (cached && Array.isArray(cached)) {
    matches = cached as { jobId: string; score: number }[];
  } else {
    matches = await computeAllMatches(seekerProfile.id);
    if (matches.length > 0) {
      await upsertJobMatches(seekerProfile.id, matches);
      await redis.set(cacheKey, JSON.stringify(matches), { ex: 900 });
    }
  }

  if (matches.length === 0) {
    return NextResponse.json({ jobs: [], nextCursor: null });
  }

  // Fetch applied job IDs to exclude before pagination (SKR-03).
  // Must happen before cursor slicing so pagination offsets remain stable.
  const appliedRows = await prisma.application.findMany({
    where: { seekerId: session.user.id },
    select: { jobId: true },
  });
  const appliedJobIds = new Set(appliedRows.map((r) => r.jobId));

  // Fetch job data for all matched jobs (needed for filtering + applied-exclusion)
  const jobIds = matches.map((m) => m.jobId);
  const jobs = await prisma.job.findMany({
    where: { id: { in: jobIds } },
    select: {
      id: true,
      jobType: true,
      workType: true,
      recruiter: {
        select: {
          recruiterProfile: {
            select: { companyName: true, logo: true },
          },
        },
      },
    },
  });

  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  // Apply filters and exclude already-applied jobs before cursor slicing.
  let filteredMatches = matches.filter((m) => {
    if (appliedJobIds.has(m.jobId)) return false;
    const job = jobMap.get(m.jobId);
    if (!job) return false;
    if (jobType && job.jobType !== jobType) return false;
    if (workType && job.workType !== workType) return false;
    return true;
  });

  // INT-03: Prepend boosted jobs that are active and within the seeker's matched set.
  // Boosted jobs only pin for skill-matched seekers — non-matched jobs are excluded by
  // filteredMatches already, so we only check BoostedJob within the current filtered set.
  if (filteredMatches.length > 0) {
    const now = new Date();
    const filteredJobIds = filteredMatches.map((m) => m.jobId);
    const activeBoosted = await prisma.boostedJob.findMany({
      where: {
        jobId: { in: filteredJobIds },
        expiresAt: { gt: now },
      },
      select: { jobId: true },
    });
    if (activeBoosted.length > 0) {
      const boostedJobIdSet = new Set(activeBoosted.map((b) => b.jobId));
      const boostedMatches = filteredMatches.filter((m) => boostedJobIdSet.has(m.jobId));
      const regularMatches = filteredMatches.filter((m) => !boostedJobIdSet.has(m.jobId));
      filteredMatches = [...boostedMatches, ...regularMatches];
    }
  }

  // Cursor pagination
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) as { score: number; jobId: string };
      filteredMatches = filteredMatches.filter(
        (m) => m.score < decoded.score || (m.score === decoded.score && m.jobId < decoded.jobId),
      );
    } catch {
      // Invalid cursor — ignore and start from beginning
    }
  }

  const paginated = filteredMatches.slice(0, limit + 1);
  const hasNext = paginated.length > limit;
  const pageItems = hasNext ? paginated.slice(0, limit) : paginated;

  const nextCursor = hasNext
    ? Buffer.from(JSON.stringify({ score: pageItems[pageItems.length - 1].score, jobId: pageItems[pageItems.length - 1].jobId })).toString('base64')
    : null;

  // Enrich with full job data including skills for missing-skills hint
  const paginatedJobIds = pageItems.map((m) => m.jobId);
  const enrichedJobs = await prisma.job.findMany({
    where: { id: { in: paginatedJobIds } },
    include: {
      recruiter: {
        select: {
          recruiterProfile: {
            select: { companyName: true, logo: true },
          },
        },
      },
      skills: {
        include: {
          skill: { select: { name: true } },
        },
      },
    },
  });

  const enrichedMap = new Map(enrichedJobs.map((j) => [j.id, j]));
  const scoreMap = new Map(pageItems.map((m) => [m.jobId, m.score]));

  // Seeker skill IDs for per-job missing-skill computation
  const seekerSkillIds = seekerProfile.skills.map((s) => s.skillId);

  // Preserve order from pagination
  const jobsResponse: Array<{
    id: string;
    title: string;
    companyName: string;
    companyLogoUrl: string | null;
    location: string;
    salaryRange: string;
    matchScore: number;
    tags: string[];
    postedAt: string;
    missingSkills: string[];
    missingSkillsHint: string | null;
  }> = [];

  for (const m of pageItems) {
    const job = enrichedMap.get(m.jobId);
    if (!job) continue;

    const score = scoreMap.get(m.jobId) ?? 0;

    // Compute missing skills and inline hint only for low-match cards (ENG-01, D-08..D-10).
    let missingSkills: string[] = [];
    let missingSkillsHint: string | null = null;

    if (score < LOW_MATCH_THRESHOLD) {
      // job.skills from the enrichedJobs include only { skill: { name: string } },
      // but getMissingSkillNames needs skillId too — re-use the enriched job which has it.
      const jobSkillsForHint = job.skills as Array<{ skillId: string; skill: { name: string } }>;
      missingSkills = getMissingSkillNames(seekerSkillIds, jobSkillsForHint);
      if (missingSkills.length > 0) {
        const hintSkills = missingSkills.slice(0, MAX_HINT_SKILLS);
        missingSkillsHint = `Missing: ${hintSkills.join(', ')}`;
      }
    }

    jobsResponse.push({
      id: job.id,
      title: job.title,
      companyName: job.recruiter.recruiterProfile?.companyName ?? 'Unknown',
      companyLogoUrl: job.recruiter.recruiterProfile?.logo ?? null,
      location: 'Remote',
      salaryRange: formatSalaryRange(job.salaryMin, job.salaryMax, job.currency),
      matchScore: score,
      tags: job.skills.slice(0, 3).map((s) => s.skill.name),
      postedAt: formatPostedAt(job.publishedAt),
      missingSkills,
      missingSkillsHint,
    });
  }

  return NextResponse.json({ jobs: jobsResponse, nextCursor });
}
