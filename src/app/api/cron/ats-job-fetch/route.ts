import { NextRequest } from 'next/server';
import { acquireLock, releaseLock } from '@/lib/ats/cron-lock';
import { fetchAndUpsertAllJobs } from '@/services/ats-job-fetcher.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const lock = await acquireLock();
  if (!lock) {
    return Response.json({ skipped: true, reason: 'Previous fetch still running' }, { status: 200 });
  }

  try {
    const result = await fetchAndUpsertAllJobs();
    return Response.json(result, { status: 200 });
  } finally {
    await releaseLock();
  }
}
