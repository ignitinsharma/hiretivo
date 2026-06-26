import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminSession } from '@/lib/admin/is-admin';
import { createRateLimiter, getRateLimitIp } from '@/lib/rate-limit';
import { JobStatus } from '@/constants/enums';

const atsStatsReadLimiter = createRateLimiter('admin-ats-stats-read', 30, '1 m');

/*
 * GET /api/admin/ats/stats
 * Returns ATS overview counts: active jobs, watched companies, blocked count, last fetch time.
 * Admin-gated.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getRateLimitIp(req);
  const { success } = await atsStatsReadLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const [activeAtsJobs, totalCompanies, blockedCount, lastFetchJobs] = await Promise.all([
      prisma.job.count({
        where: { isAdminPosted: true, status: JobStatus.OPEN },
      }),
      prisma.job.groupBy({
        by: ['companyName'],
        where: { isAdminPosted: true },
        _count: { companyName: true },
      }),
      prisma.atsBlocklist.count(),
      prisma.job.findFirst({
        where: { isAdminPosted: true },
        orderBy: { lastSeenAt: 'desc' },
        select: { lastSeenAt: true },
      }),
    ]);

    return NextResponse.json({
      activeAtsJobs,
      companiesWatched: totalCompanies.length,
      blockedCount,
      lastFetchAt: lastFetchJobs?.lastSeenAt ?? null,
    });
  } catch (err) {
    console.error('[ats-stats] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
