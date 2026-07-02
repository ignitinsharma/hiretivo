import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { JobStatus, UserRole } from '@/constants/enums';
import { dataFetchRateLimiter } from '@/lib/rate-limit';

/*
 * GET /api/seeker/feed/companies
 * Returns the distinct, sorted list of OPEN job company names for the feed's companies
 * multiselect filter. Seeker-only, rate-limited per user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const rows = await prisma.job.findMany({
    where: { status: JobStatus.OPEN, companyName: { not: null } },
    select: { companyName: true },
    distinct: ['companyName'],
    take: 200,
  });

  const companies = rows
    .map((r) => r.companyName)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ companies });
}
