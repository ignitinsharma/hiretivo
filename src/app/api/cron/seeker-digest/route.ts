import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSeekerDigest } from '@/lib/email/seeker-digest';
import { computeAllMatches } from '@/lib/match';

const CRON_SECRET = process.env.CRON_SECRET || 'local-dev-secret';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const optedInSeekers = await prisma.user.findMany({
    where: {
      digestEnabled: true,
      role: 'SEEKER',
      email: { not: null },
      OR: [
        { lastDigestSentAt: null },
        { lastDigestSentAt: { lt: oneWeekAgo } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
    take: 100,
  });

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const seeker of optedInSeekers) {
    processed++;

    if (!seeker.email) {
      failed++;
      continue;
    }

    try {
      const seekerProfile = await prisma.seekerProfile.findUnique({
        where: { userId: seeker.id },
        select: { id: true },
      });

      if (!seekerProfile) {
        failed++;
        continue;
      }

      const appliedJobIds = await prisma.application.findMany({
        where: { seekerId: seeker.id },
        select: { jobId: true },
      });
      const appliedIds = new Set(appliedJobIds.map((a) => a.jobId));

      const matches = await computeAllMatches(seekerProfile.id);

      if (matches.length === 0) {
        await prisma.user.update({
          where: { id: seeker.id },
          data: { lastDigestSentAt: now },
        });
        continue;
      }

      const jobIds = matches.slice(0, 20).map((m) => m.jobId);
      const jobs = await prisma.job.findMany({
        where: {
          id: { in: jobIds },
          status: 'OPEN',
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
        await sendSeekerDigest(seeker.email, seeker.name, filteredJobs);
        sent++;
      }

      await prisma.user.update({
        where: { id: seeker.id },
        data: { lastDigestSentAt: now },
      });
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