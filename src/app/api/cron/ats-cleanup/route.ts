import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { subDays } from 'date-fns';
import { JobStatus } from '@/constants/enums';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * ats-cleanup cron
 * Deletes closed ATS jobs older than 30 days to prevent accumulation.
 * Handles both jobs with closedAt timestamps and legacy jobs with closedAt=null.
 * Runs weekly on Sundays at 3:00 AM.
 * @returns { deleted: number } count of deleted jobs
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const thirtyDaysAgo = subDays(new Date(), 30);

  // Find old closed jobs
  // Handle both closedAt < 30 days ago AND legacy jobs with closedAt=null + updatedAt < 30 days ago
  const oldJobIds = await prisma.job.findMany({
    where: {
      isAdminPosted: true,
      atsSource: { not: null },
      status: JobStatus.CLOSED,
      OR: [
        { closedAt: { lt: thirtyDaysAgo } },
        { closedAt: null, updatedAt: { lt: thirtyDaysAgo } },
      ],
    },
    select: { id: true },
  });

  if (oldJobIds.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const ids = oldJobIds.map((j) => j.id);

  // Delete in order (JobSkill + JobMatch reference Job)
  await prisma.jobSkill.deleteMany({ where: { jobId: { in: ids } } });
  await prisma.jobMatch.deleteMany({ where: { jobId: { in: ids } } });
  await prisma.job.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ deleted: oldJobIds.length });
}
