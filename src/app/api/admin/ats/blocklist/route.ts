import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminSession } from '@/lib/admin/is-admin';
import { createRateLimiter, getRateLimitIp } from '@/lib/rate-limit';
import { closeBlockedCompanyJobs } from '@/services/ats-job-fetcher.service';

const atsBlocklistReadLimiter = createRateLimiter('admin-ats-blocklist-read', 30, '1 m');
const atsBlocklistWriteLimiter = createRateLimiter('admin-ats-blocklist-write', 5, '1 m');

/*
 * GET /api/admin/ats/blocklist
 * Returns all ATS blocklist entries ordered by most recent. Admin-gated.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getRateLimitIp(req);
  const { success } = await atsBlocklistReadLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const blocklist = await prisma.atsBlocklist.findMany({
      orderBy: { blockedAt: 'desc' },
    });
    return NextResponse.json({ blocklist });
  } catch (err) {
    console.error('[ats-blocklist] list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/*
 * POST /api/admin/ats/blocklist
 * Adds a company to the ATS blocklist and immediately closes any open ATS jobs
 * from that company. Admin-gated.
 *
 * @body companyName - Required. Domain and reason are optional.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getRateLimitIp(req);
  const { success } = await atsBlocklistWriteLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { companyName, domain, reason } = body;

    if (!companyName) {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
    }

    const entry = await prisma.atsBlocklist.create({
      data: {
        companyName,
        domain,
        reason,
        blockedBy: session!.user?.id ?? null,
      },
    });

    await closeBlockedCompanyJobs(companyName);

    return NextResponse.json({ blocklist: entry }, { status: 201 });
  } catch (err) {
    console.error('[ats-blocklist] create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
