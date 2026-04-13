import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createJobSchema } from '@/lib/validations/job';
import { createRateLimiter } from '@/lib/rate-limit';
import { UserRole } from '@/constants/enums';

const jobListRateLimiter = createRateLimiter("job-list", 60, "1 m");

// GET /api/jobs — list recruiter's own jobs (auth-scoped)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting — 60 job list requests/min (prevent scraping)
  const { success } = await jobListRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const jobs = await prisma.job.findMany({
    where: { recruiterId: session.user.id },
    include: {
      skills: {
        include: { skill: true },
      },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(jobs);
}

// POST /api/jobs — create job with plan gate check
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Security fix: Only recruiters can create jobs
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden — recruiters only' }, { status: 403 });
  }

  // D-10: FREE plan gate — check user.plan (on User model, not RecruiterProfile)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (user?.plan === 'FREE') {
    const activeCount = await prisma.job.count({
      where: { recruiterId: session.user.id, status: 'OPEN' },
    });
    if (activeCount >= 1) {
      return NextResponse.json(
        { error: 'FREE plan allows 1 active job. Upgrade to post more.' },
        { status: 403 }
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    );
  }

  const { skills, status: _status, ...jobData } = parsed.data;

  // Create job + skills atomically (D-08)
  const job = await prisma.$transaction(async (tx) => {
    const j = await tx.job.create({
      data: {
        ...jobData,
        recruiterId: session.user.id,
        status: 'OPEN',
        publishedAt: new Date(),
      },
    });
    await tx.jobSkill.createMany({
      data: skills.map((s) => ({
        jobId: j.id,
        skillId: s.skillId,
        level: s.level ?? 'INTERMEDIATE',
      })),
    });
    return j;
  });

  return NextResponse.json(job, { status: 201 });
}
