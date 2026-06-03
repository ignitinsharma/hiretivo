import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import {
  ApplicationStatus,
  ApplyType,
  JobStatus,
  UserRole,
} from '@/constants/enums';
import { prisma } from '@/lib/prisma';
import { writeRateLimiter } from '@/lib/rate-limit';

interface RouteContext {
  params: {
    id: string;
  };
}

/*
 * getMatchScore
 * Looks up the seeker's precomputed match score for an external job.
 * Returns zero when no seeker profile or match record exists.
 */
async function getMatchScore(jobId: string, seekerId: string): Promise<number> {
  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: seekerId },
    select: { id: true },
  });

  if (!seekerProfile) return 0;

  const jobMatch = await prisma.jobMatch.findUnique({
    where: {
      jobId_seekerProfileId: {
        jobId,
        seekerProfileId: seekerProfile.id,
      },
    },
    select: { score: true },
  });

  return jobMatch?.score ?? 0;
}

/*
 * POST /api/jobs/[id]/external-apply/confirm
 * Records a seeker application after they confirm an external apply action.
 * Returns the application id or auth/not-found/rate-limit errors.
 */
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Verification gate — only VERIFIED seekers may record an external application
  const seekerUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true },
  });
  if (seekerUser?.verificationStatus !== "VERIFIED") {
    return NextResponse.json(
      { error: 'Complete verification to apply to jobs' },
      { status: 403 },
    );
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { resumeKey: true },
  });
  if (!seekerProfile?.resumeKey) {
    return NextResponse.json(
      {
        error:
          'Upload your resume in Settings before applying. Go to /seeker/settings to continue.',
      },
      { status: 400 },
    );
  }

  const job = await prisma.job.findFirst({
    where: {
      id: params.id,
      status: JobStatus.OPEN,
      applyType: ApplyType.EXTERNAL,
    },
    select: { id: true },
  });

  if (!job) {
    return NextResponse.json({ error: 'External job not found' }, { status: 404 });
  }

  const matchScore = await getMatchScore(job.id, session.user.id);
  const application = await prisma.application.upsert({
    where: {
      jobId_seekerId: {
        jobId: job.id,
        seekerId: session.user.id,
      },
    },
    create: {
      jobId: job.id,
      seekerId: session.user.id,
      status: ApplicationStatus.APPLIED,
      matchScore,
    },
    update: {
      status: ApplicationStatus.APPLIED,
      matchScore,
    },
  });

  return NextResponse.json({ data: { id: application.id } }, { status: 200 });
}
