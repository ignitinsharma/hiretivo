import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { JobType as PrismaJobType, WorkType as PrismaWorkType } from '@prisma/client';
import { auth } from '@/auth';
import { CurrencyCode, JobStatus, UserRole, MatchThreshold, LocationClass } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { resolveLogoUrl } from '@/lib/r2';
import { computeAllMatches } from '@/lib/match';
import { feedFilterSchema } from '@/lib/validations/match';
import { createRateLimiter } from '@/lib/rate-limit';
import { getMissingSkillNames } from '@/lib/seeker-dashboard';
import { resolveJobCompany, resolveCompanyLogoUrl } from '@/lib/jobs/resolve-job-company';
import { stripHtml } from '@/lib/utils';

const LOCATION_BADGE: Record<LocationClass, string> = {
  [LocationClass.WORLDWIDE]: '🌍 Remote (Worldwide)',
  [LocationClass.US_ONLY]: '🇺🇸 Remote (US Only)',
  [LocationClass.EMEA]: '🇪🇺 Remote (EMEA)',
  [LocationClass.INDIA]: '🇮🇳 India',
  [LocationClass.ONSITE]: '🏢 On-site',
};

interface JobFeedItem {
  id: string;
  title: string;
  companyId: string | null;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  salaryRange: string;
  matchScore: number;
  tags: string[];
  postedAt: string;
  jobType: string;
  workType: string | null;
  experienceLevel: string | null;
  companyIndustry: string | null;
  companySize: string | null;
  companyFundingType: string | null;
  matchedSkillNames: string[];
  applyType: string;
  externalApplyUrl: string | null;
  missingSkills: string[];
  missingSkillsHint: string | null;
  description: string | null;
  applicantCount: number;
  locationClass: string | null;
  visaSponsored: boolean;
}

const feedRateLimiter = createRateLimiter("seeker-feed", 30, "1 m");


// Jobs below this match score receive an inline missing-skills explainer.
// Using MatchThreshold.GOOD (60) as the low-match threshold — seeker is unlikely
// to apply anyway so surfacing the gap is more helpful than hiding it.
const LOW_MATCH_THRESHOLD = MatchThreshold.GOOD;

// Max number of missing skill names shown inline to keep cards compact (D-10).
const MAX_HINT_SKILLS = 3;

function formatSalaryRange(min: number | null, max: number | null, currency: string | null): string {
  const cur = currency ?? CurrencyCode.USD;
  const symbol = cur === CurrencyCode.USD ? '$' : cur === CurrencyCode.GBP ? '£' : cur === CurrencyCode.EUR ? '€' : '';
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
    return NextResponse.json({ jobs: [], nextCursor: null, hasMoreRecent: false });
  }

  const parsed = feedFilterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid query params' }, { status: 400 });
  }

  const { cursor, limit, jobType, workType, recentOffset, locationClass, visaSponsored, q } = parsed.data;

  const appliedRows = await prisma.application.findMany({
    where: { seekerId: session.user.id },
    select: { jobId: true },
  });
  const appliedJobIds = new Set(appliedRows.map((r) => r.jobId).filter((id): id is string => id !== null));

  const dismissedRows = await prisma.dismissedJob.findMany({
    where: { userId: session.user.id },
    select: { jobId: true },
  });
  const dismissedJobIds = new Set(dismissedRows.map((r) => r.jobId).filter((id): id is string => id !== null));

  const feedFilterWhere: Prisma.JobWhereInput = {
    status: JobStatus.OPEN,
    id: { notIn: [...appliedJobIds, ...dismissedJobIds] },
  };
  if (jobType) feedFilterWhere.jobType = jobType as PrismaJobType;
  if (workType) feedFilterWhere.workType = workType as PrismaWorkType;
  if (locationClass) feedFilterWhere.locationClass = locationClass;
  if (visaSponsored) feedFilterWhere.visaSponsored = true;

  // Hybrid mode: recentOffset provided → unmatched jobs tail
  if (recentOffset !== undefined) {
    const matchedJobIds = await prisma.jobMatch.findMany({
      where: { seekerProfileId: seekerProfile.id },
      select: { jobId: true },
    });
    const allMatchedIds = matchedJobIds.map((m) => m.jobId);

    const recentWhere: Prisma.JobWhereInput = {
      ...feedFilterWhere,
      id: { notIn: [...allMatchedIds, ...appliedJobIds, ...dismissedJobIds] },
      isAdminPosted: true,
    };
    if (q) {
      const qLower = q.toLowerCase();
      recentWhere.OR = [
        { title: { contains: qLower, mode: 'insensitive' } },
        { companyName: { contains: qLower, mode: 'insensitive' } },
      ];
    }
    const recentJobs = await prisma.job.findMany({
      where: recentWhere,
      orderBy: { publishedAt: 'desc' },
      skip: recentOffset,
      take: limit + 1,
      include: {
        recruiter: {
          select: {
            recruiterProfile: {
              select: { id: true, companyName: true, logo: true, companySize: true, fundingType: true, industry: true },
            },
          },
        },
        skills: {
          select: { skillId: true, skill: { select: { name: true } } },
        },
        _count: { select: { applications: true } },
      },
    });

    const hasMoreRecent = recentJobs.length > limit;
    const pageJobs = hasMoreRecent ? recentJobs.slice(0, limit) : recentJobs;
    const seekerSkillIds = seekerProfile.skills.map((s) => s.skillId);
    const jobsResponse = pageJobs.map((job) => buildJobResponse(job, seekerSkillIds, 0));

    return NextResponse.json({
      jobs: jobsResponse,
      recentOffset: recentOffset + pageJobs.length,
      hasMoreRecent,
      section: 'recent',
    });
  }

  // === Matched jobs flow (existing behavior) ===
  const cacheKey = `match:${seekerProfile.id}`;
  let matches: { jobId: string; score: number }[];

  const cached = await redis.get(cacheKey);
  if (cached && Array.isArray(cached)) {
    matches = cached as { jobId: string; score: number }[];
  } else {
    matches = await computeAllMatches(seekerProfile.id);
    if (matches.length > 0) {
      await redis.set(cacheKey, JSON.stringify(matches), { ex: 900 });
    }
  }

  if (matches.length === 0) {
    return NextResponse.json({ jobs: [], nextCursor: null, hasMoreRecent: true });
  }

  const jobIds = matches.map((m) => m.jobId);
  const jobs = await prisma.job.findMany({
    where: { id: { in: jobIds }, status: JobStatus.OPEN },
    select: {
      id: true,
      title: true,
      jobType: true,
      workType: true,
      locationClass: true,
      visaSponsored: true,
      companyName: true,
      recruiter: {
        select: {
          recruiterProfile: {
            select: { id: true, companyName: true, logo: true },
          },
        },
      },
    },
  });

  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  let filteredMatches = matches.filter((m) => {
    if (appliedJobIds.has(m.jobId)) return false;
    if (dismissedJobIds.has(m.jobId)) return false;
    const job = jobMap.get(m.jobId);
    if (!job) return false;
    if (jobType && job.jobType !== jobType) return false;
    if (workType && job.workType !== workType) return false;
    if (locationClass && job.locationClass !== locationClass) return false;
    if (visaSponsored && !job.visaSponsored) return false;
    if (q) {
      const qLower = q.toLowerCase();
      const companyName = job.companyName ?? job.recruiter?.recruiterProfile?.companyName ?? '';
      const matchesTitle = job.title?.toLowerCase().includes(qLower);
      const matchesCompany = companyName.toLowerCase().includes(qLower);
      if (!matchesTitle && !matchesCompany) return false;
    }
    return true;
  });

  if (filteredMatches.length > 0) {
    const now = new Date();
    const filteredJobIds = filteredMatches.map((m) => m.jobId);
    const activeBoosted = await prisma.boostedJob.findMany({
      where: { jobId: { in: filteredJobIds }, expiresAt: { gt: now } },
      select: { jobId: true },
    });
    if (activeBoosted.length > 0) {
      const boostedJobIdSet = new Set(activeBoosted.map((b) => b.jobId));
      const boostedMatches = filteredMatches.filter((m) => boostedJobIdSet.has(m.jobId));
      const regularMatches = filteredMatches.filter((m) => !boostedJobIdSet.has(m.jobId));
      filteredMatches = [...boostedMatches, ...regularMatches];
    }
  }

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) as { score: number; jobId: string };
      filteredMatches = filteredMatches.filter(
        (m) => m.score < decoded.score || (m.score === decoded.score && m.jobId < decoded.jobId),
      );
    } catch {
      // invalid cursor — start from beginning
    }
  }

  const totalCount = filteredMatches.length;
  const paginated = filteredMatches.slice(0, limit + 1);
  const hasNext = paginated.length > limit;
  const pageItems = hasNext ? paginated.slice(0, limit) : paginated;
  const remainingCount = Math.max(totalCount - pageItems.length, 0);

  const nextCursor = hasNext
    ? Buffer.from(JSON.stringify({ score: pageItems[pageItems.length - 1].score, jobId: pageItems[pageItems.length - 1].jobId })).toString('base64')
    : null;

  const paginatedJobIds = pageItems.map((m) => m.jobId);
  const enrichedJobs = await prisma.job.findMany({
    where: { id: { in: paginatedJobIds }, status: JobStatus.OPEN },
    include: {
      recruiter: {
        select: {
          recruiterProfile: {
            select: { id: true, companyName: true, logo: true, companySize: true, fundingType: true, industry: true },
          },
        },
      },
      skills: {
        select: { skillId: true, skill: { select: { name: true } } },
      },
      _count: { select: { applications: true } },
    },
  });

  const enrichedMap = new Map(enrichedJobs.map((j) => [j.id, j]));
  const scoreMap = new Map(pageItems.map((m) => [m.jobId, m.score]));
  const seekerSkillIds = seekerProfile.skills.map((s) => s.skillId);

  const jobsResponse: Array<JobFeedItem> = [];

  for (const m of pageItems) {
    const job = enrichedMap.get(m.jobId);
    if (!job) continue;

    jobsResponse.push(buildJobResponse(job, seekerSkillIds, scoreMap.get(m.jobId) ?? 0));
  }

  // Check if there are unmatched jobs available
  const matchedJobIds = matches.map((m) => m.jobId);
  const unmatchedCount = await prisma.job.count({
    where: {
      status: JobStatus.OPEN,
      isAdminPosted: true,
      id: { notIn: [...matchedJobIds, ...appliedJobIds, ...dismissedJobIds] },
    },
  });

  return NextResponse.json({
    jobs: jobsResponse,
    nextCursor,
    totalCount,
    remainingCount,
    hasMoreRecent: unmatchedCount > 0,
  });
}

function buildJobResponse(
  job: any,
  seekerSkillIds: string[],
  score: number,
): JobFeedItem {
  const jobSkillsForHint = job.skills ?? [];
  const matchedSkillNames = jobSkillsForHint
    .filter((js: any) => seekerSkillIds.includes(js.skillId))
    .map((js: any) => js.skill.name);
  const missingSkills = getMissingSkillNames(seekerSkillIds, jobSkillsForHint);
  let missingSkillsHint: string | null = null;

  if (score < LOW_MATCH_THRESHOLD && missingSkills.length > 0) {
    missingSkillsHint = `Missing: ${missingSkills.slice(0, MAX_HINT_SKILLS).join(', ')}`;
  }

  const company = resolveJobCompany({
    companyName: job.companyName,
    companyLogoUrl: job.companyLogoUrl,
    companySize: job.companySize,
    companyIndustry: job.companyIndustry,
    companyFunding: job.companyFunding,
    recruiter: job.recruiter,
  });

  const locationBadge = (LOCATION_BADGE[job.locationClass as LocationClass] || job.workType) ?? 'Remote';

  return {
    id: job.id,
    title: job.title,
    companyId: company.companyId,
    companyName: company.companyName,
    companyLogoUrl: resolveCompanyLogoUrl(
      company.companyLogoUrl ?? resolveLogoUrl(company.rawRecruiterLogo),
      job.companyWebsite,
    ),
    location: locationBadge,
    salaryRange: formatSalaryRange(job.salaryMin, job.salaryMax, job.currency),
    matchScore: score,
    tags: jobSkillsForHint.slice(0, 3).map((js: any) => js.skill.name),
    postedAt: formatPostedAt(job.publishedAt),
    jobType: job.jobType,
    workType: job.workType,
    experienceLevel: job.experienceLevel,
    companyIndustry: company.companyIndustry,
    companySize: company.companySize,
    companyFundingType: company.companyFundingType,
    matchedSkillNames,
    applyType: job.applyType,
    externalApplyUrl: job.externalApplyUrl,
    missingSkills,
    missingSkillsHint,
    description: job.description ? stripHtml(job.description) : null,
    applicantCount: job._count?.applications ?? 0,
    locationClass: job.locationClass ?? null,
    visaSponsored: job.visaSponsored ?? false,
  };
}
