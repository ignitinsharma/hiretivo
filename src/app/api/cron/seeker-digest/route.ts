import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JobStatus, UserRole } from '@/constants/enums';
import { sendSeekerDigest } from '@/lib/email/seeker-digest';
import { computeAllMatches } from '@/lib/match';

const CRON_SECRET = process.env.CRON_SECRET ?? 'local-dev-secret';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();

  // digestEnabled lives on SeekerProfile (not User); select via seekerProfile relation
  const optedInSeekerProfiles = await prisma.seekerProfile.findMany({
    where: {
      digestEnabled: true,
      user: {
        role: UserRole.SEEKER,
        email: { not: null },
      },
    },
    select: {
      id: true,
      userId: true,
      user: {
        select: { email: true, name: true },
      },
    },
    take: 100,
  });

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const profile of optedInSeekerProfiles) {
    processed++;

    if (!profile.user.email) {
      failed++;
      continue;
    }

    try {
      const appliedJobIds = await prisma.application.findMany({
        where: { seekerId: profile.userId },
        select: { jobId: true },
      });
      const appliedIds = new Set(appliedJobIds.map((a) => a.jobId));

      const matches = await computeAllMatches(profile.id);

      if (matches.length === 0) {
        continue;
      }

      const jobIds = matches.slice(0, 20).map((m) => m.jobId);
      const jobs = await prisma.job.findMany({
        where: {
          id: { in: jobIds },
          status: JobStatus.OPEN,
          publishedAt: { not: null },
        },
        include: {
          recruiter: {
            select: {
              recruiterProfile: { select: { companyName: true } },
            },
          },
        },
      });

      const filteredJobs = jobs
        .filter((j) => !appliedIds.has(j.id))
        .slice(0, 5)
        .map((job) => {
          const match = matches.find((m) => m.jobId === job.id);
          return {
            id: job.id,
            title: job.title,
            companyName: job.recruiter.recruiterProfile?.companyName ?? 'Unknown Company',
            matchScore: match?.score ?? 0,
          };
        });

      if (filteredJobs.length > 0) {
        await sendSeekerDigest(profile.user.email, profile.user.name, filteredJobs);
        sent++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    processed,
    sent,
    failed,
    timestamp: now.toISOString(),
  });
}
