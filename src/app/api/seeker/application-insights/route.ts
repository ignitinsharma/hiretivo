import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { summarizeApplications } from '@/lib/application-insights';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';

const rateLimiter = createRateLimiter('application-insights', 30, '1 m');
const PERIODS = new Set([4, 8, 12]);

/** Returns the seeker's funnel, stage distribution, and weekly saved application activity. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== UserRole.SEEKER) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { success } = await rateLimiter.limit(session.user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const selectedPeriod = Number(request.nextUrl.searchParams.get('weeks') ?? '4');
  if (!PERIODS.has(selectedPeriod)) return NextResponse.json({ error: 'Invalid period' }, { status: 400 });

  const applications = await prisma.application.findMany({
    where: { seekerId: session.user.id },
    select: { pipelineStage: true, furthestPipelineStage: true, createdAt: true },
  });

  return NextResponse.json({ data: summarizeApplications(applications, selectedPeriod, new Date()) });
}
