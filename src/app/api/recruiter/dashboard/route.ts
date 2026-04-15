import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserRole, JobStatus, ApplicationStatus } from '@/constants/enums';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const recruiterId = session.user.id;

  const jobWhere = { recruiterId };

  const [
    activeJobs,
    totalApplications,
    newThisWeek,
    avgMatchScore,
    recentApps,
  ] = await Promise.all([
    prisma.job.count({
      where: { ...jobWhere, status: JobStatus.OPEN },
    }),
    prisma.application.count({
      where: { job: jobWhere },
    }),
    prisma.application.count({
      where: {
        job: jobWhere,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.application.aggregate({
      where: { job: jobWhere },
      _avg: { matchScore: true },
    }),
    prisma.application.findMany({
      where: { job: jobWhere },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        matchScore: true,
        status: true,
        createdAt: true,
        job: { select: { title: true } },
        seeker: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            seekerProfile: {
              select: {
                primaryRole: true,
                headline: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const recentApplicants = recentApps.map((app) => ({
    id: app.id,
    name: app.seeker.name ?? 'Anonymous',
    email: app.seeker.email ?? '',
    avatar: app.seeker.image,
    position: app.job.title,
    matchScore: app.matchScore,
    appliedDate: app.createdAt.toISOString(),
    status: app.status,
    primaryRole: app.seeker.seekerProfile?.primaryRole ?? null,
  }));

  return NextResponse.json({
    stats: {
      activeJobs,
      totalApplications,
      newThisWeek,
      interviewsScheduled: 0,
      avgMatchScore: avgMatchScore._avg.matchScore
        ? Math.round(avgMatchScore._avg.matchScore)
        : 0,
    },
    recentApplicants,
  });
}