import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@/constants/enums';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/*
 * POST /api/cron/cleanup-deleted-jobs
 * Hard-deletes soft-deleted jobs older than 30 days.
 * Prisma cascade removes all related rows (applications, skills, saves, etc.).
 * Protected by CRON_SECRET header. Called daily via Vercel cron.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);

  const { count } = await prisma.job.deleteMany({
    where: {
      status: JobStatus.DELETED,
      OR: [
        { closedAt: { lte: cutoff } },
        { closedAt: null, updatedAt: { lte: cutoff } },
      ],
    },
  });

  console.log(`[cleanup-deleted-jobs] Hard-deleted ${count} jobs older than 30 days`);

  return NextResponse.json({ deleted: count });
}
