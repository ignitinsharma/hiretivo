import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { dataFetchRateLimiter } from '@/lib/rate-limit';

/*
 * GET /api/recruiter/jobs
 * Lists minimal job rows for the authenticated recruiter.
 * Returns job summaries or auth/rate-limit errors.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const jobs = await prisma.job.findMany({
    where: { recruiterId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  });

  return NextResponse.json({ jobs });
}
