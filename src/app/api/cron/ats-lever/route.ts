import { NextRequest } from 'next/server';
import { acquireLock, releaseLock } from '@/lib/ats/cron-lock';
import { fetchAndAutoClose } from '@/services/ats-job-fetcher.service';
import { isImportPaused } from '@/lib/ats/pause';
import { AtsSource } from '@/constants/enums';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/*
 * GET /api/cron/ats-lever
 * Vercel cron handler — fetches and upserts Lever ATS jobs. Runs daily at midnight UTC.
 * Protected by CRON_SECRET bearer token.
 * Returns { paused: true } early if admin has paused ATS imports.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (await isImportPaused()) {
    return Response.json({ paused: true, source: AtsSource.LEVER }, { status: 200 });
  }

  const lock = await acquireLock('cron:ats-lever-lock');
  if (!lock) {
    return Response.json({ skipped: true, reason: 'Previous fetch still running' }, { status: 200 });
  }

  try {
    const result = await fetchAndAutoClose(AtsSource.LEVER);
    return Response.json(result, { status: 200 });
  } finally {
    await releaseLock('cron:ats-lever-lock');
  }
}
