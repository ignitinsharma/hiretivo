import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import { isAdminSession } from '@/lib/admin/is-admin';
import { isImportPaused, setImportPaused } from '@/lib/ats/pause';
import { createRateLimiter } from '@/lib/rate-limit';

/* Admin read limiter — 30 req/min per userId (authenticated gate) */
const adminReadLimiter = createRateLimiter('admin-ats-pause-read', 30, '1 m');

/* Admin write limiter — 5 req/min per userId (write gate per CLAUDE.md) */
const adminWriteLimiter = createRateLimiter('admin-ats-pause-write', 5, '1 m');

/*
 * GET /api/admin/ats/pause
 * Returns current ATS import pause state.
 * Admin-gated. Rate-limited to 30 req/min per user.
 * @returns { paused: boolean }
 */
function getUserIdOrForbid(session: Session | null): string | NextResponse {
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session.user.id;
}

export async function GET() {
  const session = await auth();
  const userId = getUserIdOrForbid(session);
  if (userId instanceof NextResponse) return userId;

  const { success } = await adminReadLimiter.limit(userId);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const paused = await isImportPaused();
  return NextResponse.json({ paused });
}

/*
 * POST /api/admin/ats/pause
 * Toggles the ATS import pause flag.
 * Admin-gated. Rate-limited to 5 req/min per user.
 * @body { paused: boolean }
 * @returns { paused: boolean }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = getUserIdOrForbid(session);
  if (userId instanceof NextResponse) return userId;

  const { success } = await adminWriteLimiter.limit(userId);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const body = await req.json();
  if (typeof body?.paused !== 'boolean') {
    return NextResponse.json({ error: 'paused must be a boolean' }, { status: 400 });
  }

  await setImportPaused(body.paused);
  return NextResponse.json({ paused: body.paused });
}
