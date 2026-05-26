import { startOfMonth } from 'date-fns';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { getUnlockQuota } from '@/lib/billing/plan-access';
import { prisma } from '@/lib/prisma';
import { dataFetchRateLimiter } from '@/lib/rate-limit';
import type { RecruiterAnalyticsResponse } from '@/modules/recruiter/analytics/types/analytics.types';

/*
 * GET /api/recruiter/analytics
 * Aggregates funnel (unlocked → applied → reviewing → interview → offer → hired),
 * credit usage (talent_pool unlocks in current billing period vs quota), and
 * top 5 skills across all unlocked engineers for the authenticated recruiter.
 *
 * Auth:     session.user.id required (401)
 * Role:     RECRUITER only (403)
 * Rate:     dataFetchRateLimiter keyed on userId (429)
 * Response: { data: RecruiterAnalyticsResponse }
 */
export async function GET() {
  // 1. Auth guard
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Role guard
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Rate limit (keyed on authenticated user id, not IP — T-14-07)
  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const recruiterId = session.user.id;

  // 4. Parallel aggregation queries for performance
  const [unlockedCount, statusGroups, unlocksWithSkills, recruiterUser] =
    await Promise.all([
      // Total engineers ever unlocked by this recruiter
      prisma.engineerUnlock.count({ where: { recruiterId } }),

      // Application counts grouped by status, scoped to recruiter-owned jobs (T-14-06)
      prisma.application.groupBy({
        by: ['status'],
        where: { job: { recruiterId } },
        _count: { _all: true },
      }),

      // Unlocked engineers with their skill graph for top-skill aggregation (ANLT-05)
      prisma.engineerUnlock.findMany({
        where: { recruiterId },
        select: {
          engineer: {
            select: {
              seekerProfile: {
                select: {
                  skills: {
                    select: { skill: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      }),

      // Recruiter plan + subscription for quota and billing period (ANLT-04)
      prisma.user.findUnique({
        where: { id: recruiterId },
        select: {
          plan: true,
          subscription: { select: { currentPeriodStart: true } },
        },
      }),
    ]);

  // 5. Build funnel (ANLT-02, D-06)
  // Use a Map so missing statuses default to 0 rather than throwing
  const statusMap = new Map(statusGroups.map((g) => [g.status, g._count._all]));

  const rawCounts = [
    unlockedCount,
    statusMap.get('APPLIED') ?? 0,
    statusMap.get('REVIEWING') ?? 0,
    statusMap.get('INTERVIEW') ?? 0,
    statusMap.get('OFFER') ?? 0,
    statusMap.get('HIRED') ?? 0,
  ];

  const STAGES = [
    { key: 'unlocked', label: 'Unlocked' },
    { key: 'applied', label: 'Applied' },
    { key: 'reviewing', label: 'Reviewing' },
    { key: 'interview', label: 'Interviewing' },
    { key: 'offer', label: 'Offered' },
    { key: 'hired', label: 'Hired' },
  ] as const;

  const funnel = STAGES.map((s, i) => ({
    key: s.key,
    label: s.label,
    count: rawCounts[i],
    // null for first stage; null when previous stage count is 0 to avoid divide-by-zero
    conversionPct:
      i === 0 || rawCounts[i - 1] === 0
        ? null
        : Math.round((rawCounts[i] / rawCounts[i - 1]) * 100),
  }));

  // 6. Credits (ANLT-04)
  // Quota from plan; creditsUsed = talent_pool unlocks within current billing period
  const totalQuota = getUnlockQuota(recruiterUser?.plan);
  const now = new Date();
  // Fall back to start of current calendar month if no active subscription (CLAUDE.md 1.3 — date-fns only)
  const periodStart =
    recruiterUser?.subscription?.currentPeriodStart ?? startOfMonth(now);

  const creditsUsed = await prisma.engineerUnlock.count({
    where: {
      recruiterId,
      source: 'talent_pool',
      unlockedAt: { gte: periodStart },
    },
  });

  const creditsRemaining =
    totalQuota === null ? null : Math.max(0, totalQuota - creditsUsed);

  // 7. Top skills (ANLT-05) — frequency map over all unlocked engineer skills → top 5
  const freq = new Map<string, number>();
  for (const u of unlocksWithSkills) {
    for (const s of u.engineer?.seekerProfile?.skills ?? []) {
      freq.set(s.skill.name, (freq.get(s.skill.name) ?? 0) + 1);
    }
  }
  const topSkills = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // 8. Return typed response
  return NextResponse.json(
    {
      data: {
        funnel,
        creditsUsed,
        creditsRemaining,
        totalQuota,
        topSkills,
      } satisfies RecruiterAnalyticsResponse,
    },
    { status: 200 }
  );
}
