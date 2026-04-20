import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole } from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { AnalyticsParamsSchema } from '@/lib/validations/analytics.schema';
import type { JobAnalyticsResponse, ViewTrendPoint } from '@/modules/recruiter/jobs/types/analytics.types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Role check
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Param validation
  const { id } = await params;
  const parsed = AnalyticsParamsSchema.safeParse({ id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 4. Ownership check — return 404 to avoid leaking job existence (T-13-05)
  const job = await prisma.job.findFirst({
    where: { id: parsed.data.id, recruiterId: session.user.id },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 5-10. Run all aggregation queries in parallel for performance
  const [viewCount, applicationCount, avgResult, applicationsWithSkills, rawTrendEvents] =
    await Promise.all([
      // 5. View count (total all time)
      prisma.clickEvent.count({
        where: { jobId: id, source: 'job_detail' },
      }),
      // 6. Application count
      prisma.application.count({
        where: { jobId: id },
      }),
      // 8. Avg match score
      prisma.application.aggregate({
        where: { jobId: id },
        _avg: { matchScore: true },
      }),
      // 9. Applications with seeker skills for top skills
      prisma.application.findMany({
        where: { jobId: id },
        select: {
          seeker: {
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
      // 10. Raw trend events for last 30 days
      prisma.clickEvent.findMany({
        where: {
          jobId: id,
          source: 'job_detail',
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
      }),
    ]);

  // 7. Apply rate
  const applyRate =
    viewCount > 0
      ? Math.round((applicationCount / viewCount) * 100 * 10) / 10
      : 0;

  // 8. Avg match score (rounded to nearest integer)
  const avgMatchScore = Math.round(avgResult._avg.matchScore ?? 0);

  // 9. Build skill frequency map → top 5
  const skillFrequency = new Map<string, number>();
  for (const application of applicationsWithSkills) {
    const skills = application.seeker?.seekerProfile?.skills ?? [];
    for (const s of skills) {
      const name = s.skill.name;
      skillFrequency.set(name, (skillFrequency.get(name) ?? 0) + 1);
    }
  }
  const topSkills = Array.from(skillFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // 10. Build 30-day view trend
  const dayViewMap = new Map<string, number>();
  for (const event of rawTrendEvents) {
    const dateKey = event.createdAt.toISOString().slice(0, 10);
    dayViewMap.set(dateKey, (dayViewMap.get(dateKey) ?? 0) + 1);
  }

  const viewTrend: ViewTrendPoint[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    viewTrend.push({ date: dateKey, views: dayViewMap.get(dateKey) ?? 0 });
  }

  const analytics: JobAnalyticsResponse = {
    viewCount,
    applyRate,
    avgMatchScore,
    topSkills,
    viewTrend,
  };

  return NextResponse.json({ data: analytics }, { status: 200 });
}
