import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import {
  getProfileStrengthSummary,
  getQuickStatsSummary,
  getSkillGapSummary,
} from '@/lib/seeker-dashboard';
import type { SeekerDashboardData } from '@/modules/seeker/dashboard/types/dashboard.types';

const dashboardRateLimiter = createRateLimiter("seeker-dashboard", 30, "1 m");

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await dashboardRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const [profileStrength, quickStats, skillGap, user] = await Promise.all([
    getProfileStrengthSummary(session.user.id),
    getQuickStatsSummary(session.user.id),
    getSkillGapSummary(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { digestEnabled: true },
    }),
  ]);

  const data: SeekerDashboardData = {
    profileStrength,
    quickStats,
    skillGap,
    digest: {
      enabled: user?.digestEnabled ?? false,
    },
  };

  return NextResponse.json({ data });
}