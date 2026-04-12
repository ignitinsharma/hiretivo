import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { computeAllMatches, upsertJobMatches } from '@/lib/match';
import { feedFilterSchema } from '@/lib/validations/match';
import { createRateLimiter } from '@/lib/rate-limit';

const feedRateLimiter = createRateLimiter("seeker-feed", 30, "1 m");

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
    select: { id: true },
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

  // Fetch job data for all matched jobs (needed for filtering)
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

  // Apply filters
  let filteredMatches = matches.filter((m) => {
    const job = jobMap.get(m.jobId);
    if (!job) return false;
    if (jobType && job.jobType !== jobType) return false;
    if (workType && job.workType !== workType) return false;
    return true;
  });

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

  // Enrich with full job data
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
  }> = [];

  for (const m of pageItems) {
    const job = enrichedMap.get(m.jobId);
    if (!job) continue;
    jobsResponse.push({
      id: job.id,
      title: job.title,
      companyName: job.recruiter.recruiterProfile?.companyName ?? 'Unknown',
      companyLogoUrl: job.recruiter.recruiterProfile?.logo ?? null,
      location: 'Remote',
      salaryRange: formatSalaryRange(job.salaryMin, job.salaryMax, job.currency),
      matchScore: scoreMap.get(m.jobId) ?? 0,
      tags: job.skills.slice(0, 3).map((s) => s.skill.name),
      postedAt: formatPostedAt(job.publishedAt),
    });
  }

  return NextResponse.json({ jobs: jobsResponse, nextCursor });
}
