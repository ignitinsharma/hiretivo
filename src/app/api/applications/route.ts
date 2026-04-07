import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applySchema = z.object({
  jobId: z.string().cuid(),
  coverLetter: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'SEEKER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    );
  }

  const { jobId, coverLetter } = parsed.data;

  const job = await prisma.job.findUnique({
    where: { id: jobId, status: 'OPEN' },
    select: { id: true, recruiterId: true },
  });
  if (!job) {
    return NextResponse.json({ error: 'Job not found or closed' }, { status: 404 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  let matchScore = 0;
  if (seekerProfile) {
    const jobMatch = await prisma.jobMatch.findUnique({
      where: {
        jobId_seekerProfileId: {
          jobId,
          seekerProfileId: seekerProfile.id,
        },
      },
    });
    matchScore = jobMatch?.score ?? 0;
  }

  try {
    const application = await prisma.application.create({
      data: {
        jobId,
        seekerId: session.user.id,
        coverLetter: coverLetter ?? null,
        matchScore,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 409 }
      );
    }
    throw error;
  }
}
