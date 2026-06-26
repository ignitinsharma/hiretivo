import { NextRequest } from 'next/server';
import { acquireLock, releaseLock } from '@/lib/ats/cron-lock';
import { fetchAndAutoClose } from '@/services/ats-job-fetcher.service';
import { AtsSource } from '@/constants/enums';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/*
 * GET /api/cron/ats-greenhouse
 * Vercel cron handler — fetches and upserts Greenhouse ATS jobs. Runs daily at midnight UTC.
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const lock = await acquireLock('cron:ats-greenhouse-lock');
  if (!lock) {
    return Response.json({ skipped: true, reason: 'Previous fetch still running' }, { status: 200 });
  }

  try {
    const result = await fetchAndAutoClose(AtsSource.GREENHOUSE);
    return Response.json(result, { status: 200 });
  } finally {
    await releaseLock('cron:ats-greenhouse-lock');
  }
}
