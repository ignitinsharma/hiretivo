import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rate-limit';
import {
  getProfileStrengthSummary,
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

  const { success } = await rateLimiter.limit(session.user.id);
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  const userId = session.user.id;

  // Fetch seeker profile
  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId },
  });

  // Fetch applied job IDs for skill gap exclusion
  const appliedJobIds = seekerProfile
    ? (
        await prisma.application.findMany({
          where: { seekerId: userId },
          select: { jobId: true },
        })
      ).map((a) => a.jobId)
    : [];

  // Parallel aggregation
  const [profileStrength, quickStats, skillGap] = await Promise.all([
    Promise.resolve(getProfileStrengthSummary(seekerProfile)),
    getQuickStatsSummary(userId),
    seekerProfile
      ? getSkillGapSummary(seekerProfile.id, appliedJobIds)
      : Promise.resolve({ items: [], total: 0 }),
  ]);

  const data: SeekerDashboardData = {
    greetingName: session.user.name ?? null,
    profileStrength,
    quickStats,
    skillGap,
    digest: {
      enabled: seekerProfile?.digestEnabled ?? false,
    },
  };

  return Response.json({ data }, { status: 200 });
}
