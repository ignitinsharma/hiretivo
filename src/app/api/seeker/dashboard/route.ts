import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import { touchLastActive } from '@/lib/touch-last-active';
import {
  getSkillGapSummary,
  getQuickStatsSummary,
} from '@/lib/seeker-dashboard';
import { UserRole } from '@/constants/enums';
import type { SeekerDashboardData } from '@/modules/seeker/dashboard/types/dashboard.types';

const rateLimiter = createRateLimiter('seeker-dashboard', 30, '1 m');

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return new Response('Forbidden', { status: 403 });
  }

  void touchLastActive(session.user.id);

  const { success } = await rateLimiter.limit(session.user.id);
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  const userId = session.user.id;

  // Fetch user verification status and seeker profile in parallel
  const [userRecord, seekerProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationStatus: true,
        seekerProfile: { select: { verificationNotes: true } },
      },
    }),
    prisma.seekerProfile.findUnique({
      where: { userId },
    }),
  ]);

  // Fetch applied job IDs for skill gap exclusion
  const appliedJobIds = seekerProfile
    ? (
        await prisma.application.findMany({
          where: { seekerId: userId },
          select: { jobId: true },
        })
      ).map((a) => a.jobId).filter((id): id is string => id !== null)
    : [];

  // Parallel aggregation
  const [quickStats, skillGap] = await Promise.all([
    getQuickStatsSummary(userId),
    seekerProfile
      ? getSkillGapSummary(seekerProfile.id, appliedJobIds)
      : Promise.resolve({ items: [], total: 0 }),
  ]);

  const data: SeekerDashboardData = {
    greetingName: session.user.name ?? null,
    quickStats,
    skillGap,
    digest: {
      enabled: seekerProfile?.digestEnabled ?? false,
    },
    verification: {
      status: userRecord?.verificationStatus ?? 'NOT_SUBMITTED',
      verificationNotes: userRecord?.seekerProfile?.verificationNotes ?? null,
    },
  };

  return Response.json({ data }, { status: 200 });
}
