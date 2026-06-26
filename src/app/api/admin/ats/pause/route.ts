import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdminSession } from '@/lib/admin/is-admin';
import { isImportPaused, setImportPaused } from '@/lib/ats/pause';

/*
 * GET /api/admin/ats/pause
 * Returns current ATS import pause state.
 * Admin-gated.
 * @returns { paused: boolean }
 */
export async function GET() {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const paused = await isImportPaused();
  return NextResponse.json({ paused });
}

/*
 * POST /api/admin/ats/pause
 * Toggles the ATS import pause flag.
 * Admin-gated.
 * @body { paused: boolean }
 * @returns { paused: boolean }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  if (typeof body?.paused !== 'boolean') {
    return NextResponse.json({ error: 'paused must be a boolean' }, { status: 400 });
  }

  await setImportPaused(body.paused);
  return NextResponse.json({ paused: body.paused });
}
