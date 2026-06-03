import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { createJobSchema } from '@/lib/validations/job';
import { createRateLimiter, writeRateLimiter } from '@/lib/rate-limit';
import { JobStatus, PlanTier, SkillLevel, UserRole } from '@/constants/enums';
import { requireVerifiedEmailForTrustedAction } from '@/lib/auth/email-verification';
import { getRecruiterJobLimit } from '@/lib/recruiter-trial';

const jobListRateLimiter = createRateLimiter("job-list", 60, "1 m");

/*
 * GET /api/jobs
 * Lists a recruiter's own jobs with server-side filtering and pagination.
 * Returns jobs, pagination, dashboard stats, and available categories.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await jobListRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '10', 10);
  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status') ?? '';
  const category = searchParams.get('category') ?? '';

  const skip = (page - 1) * limit;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const where: Record<string, unknown> = { recruiterId: session.user.id };

  if (status) where.status = status;
  if (category && category !== 'All') where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const recruiterId = session.user.id;

  const [jobs, total, totalAll, activeCount, totalApplicants, categories] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        skills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    prisma.job.count({ where }),
    prisma.job.count({ where: { recruiterId } }),
    prisma.job.count({ where: { recruiterId, status: JobStatus.OPEN } }),
    prisma.application.count({
      where: { job: { recruiterId } },
    }),
    prisma.job.findMany({
      where: { recruiterId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }),
  ]);

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
    stats: {
      totalAll,
      activeCount,
      totalApplicants,
    },
    categories: categories.map((c) => c.category).filter(Boolean),
  });
}

/*
 * POST /api/jobs
 * Creates a recruiter job after plan, email, and schema validation.
 * Returns the created job or auth/plan/validation/rate-limit errors.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden — recruiters only' }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const verificationError = await requireVerifiedEmailForTrustedAction(
    session.user.id,
  );
  if (verificationError) return verificationError;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const currentPlan = user?.plan ?? PlanTier.FREE;
  const jobLimit = getRecruiterJobLimit(currentPlan);

  if (jobLimit !== null) {
    const activeCount = await prisma.job.count({
      where: { recruiterId: session.user.id, status: { in: [JobStatus.OPEN, JobStatus.PAUSED] } },
    });

    if (activeCount >= jobLimit) {
      const planName =
        currentPlan === PlanTier.STARTER ? "Starter"
        : currentPlan === PlanTier.GROWTH ? "Growth"
        : currentPlan === PlanTier.SCALE ? "Scale"
        : "Free";
      const nextStep =
        currentPlan === PlanTier.FREE || !currentPlan
          ? "Upgrade to Starter to post up to 2 jobs."
          : currentPlan === PlanTier.STARTER
          ? "Upgrade to Growth for unlimited job posts."
          : "Contact support.";

      return NextResponse.json(
        {
          error: `${planName} plan allows ${jobLimit} active job${jobLimit === 1 ? "" : "s"}. ${nextStep}`,
        },
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

  const job = await prisma.$transaction(async (tx) => {
    const j = await tx.job.create({
      data: {
        ...jobData,
        recruiterId: session.user.id,
        status: JobStatus.OPEN,
        publishedAt: new Date(),
      },
    });
    await tx.jobSkill.createMany({
      data: skills.map((s) => ({
        jobId: j.id,
        skillId: s.skillId,
        level: s.level ?? SkillLevel.INTERMEDIATE,
      })),
    });
    return j;
  });

  return NextResponse.json(job, { status: 201 });
}
