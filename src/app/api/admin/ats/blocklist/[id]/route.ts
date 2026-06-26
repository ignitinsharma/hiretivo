import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminSession } from '@/lib/admin/is-admin';
import { createRateLimiter, getRateLimitIp } from '@/lib/rate-limit';

const atsBlocklistWriteLimiter = createRateLimiter('admin-ats-blocklist-write', 5, '1 m');

/*
 * DELETE /api/admin/ats/blocklist/[id]
 * Removes a company from the ATS blocklist. Does not re-open previously closed jobs.
 * Admin-gated.
 *
 * @param params.id - AtsBlocklist record id.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getRateLimitIp(req);
  const { success } = await atsBlocklistWriteLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    await prisma.atsBlocklist.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ats-blocklist] delete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
