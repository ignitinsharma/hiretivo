import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateJobBaseSchema } from '@/lib/validations/job';
import { invalidateJobSkillsCache } from '@/lib/match';
import { JobStatus, SkillLevel, UserRole } from '@/constants/enums';

// GET /api/jobs/[id] — public job detail with auth-gated match breakdown
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      recruiter: {
        select: {
          id: true,
          recruiterProfile: {
            select: { companyName: true, logo: true },
          },
        },
      },
      skills: {
        include: { skill: { select: { id: true, name: true, slug: true } } },
      },
    },
  });
  const session = await auth();
  const isOwner = session?.user?.id === job?.recruiter?.id;
  if (!job || (job.status !== JobStatus.OPEN && !isOwner)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let matchScore: number | null = null;
  let matchBreakdown: Array<{ skillId: string; skillName: string; isMatch: boolean }> | null = null;

  if (session?.user?.role === UserRole.SEEKER) {
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: { select: { skillId: true, skill: { select: { name: true } } } },
      },
    });

    if (seekerProfile) {
      const jobMatch = await prisma.jobMatch.findUnique({
        where: {
          jobId_seekerProfileId: {
            jobId: params.id,
            seekerProfileId: seekerProfile.id,
          },
        },
      });
      matchScore = jobMatch?.score ?? null;

      const seekerSkillIds = new Set(seekerProfile.skills.map((s) => s.skillId));
      matchBreakdown = job.skills.map((s) => ({
        skillId: s.skill.id,
        skillName: s.skill.name,
        isMatch: seekerSkillIds.has(s.skillId),
      }));
    }
  }

  return NextResponse.json({
    job: {
      id: job.id,
      title: job.title,
      description: job.description,
      jobType: job.jobType,
      workType: job.workType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      currency: job.currency,
      experienceLevel: job.experienceLevel,
      category: job.category,
      applyType: job.applyType,
      externalApplyUrl: job.externalApplyUrl,
      companyName: job.recruiter.recruiterProfile?.companyName ?? 'Unknown',
      companyLogoUrl: job.recruiter.recruiterProfile?.logo ?? null,
      skills: job.skills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        slug: s.skill.slug,
        level: s.level,
      })),
      publishedAt: job.publishedAt?.toISOString() ?? null,
    },
    matchScore,
    matchBreakdown,
  });
}

// PATCH /api/jobs/[id] — edit job fields or toggle status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Security fix: Only recruiters can modify jobs
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden — recruiters only' }, { status: 403 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { recruiterId: true },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // updateJobSchema is createJobSchema.partial() — all fields optional
  // Remove 'id' from body before parsing (id comes from URL, not body)
  const parsed = updateJobBaseSchema.omit({ id: true }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    );
  }

  const { skills, ...jobFields } = parsed.data;

  let updatedJob;

  if (skills !== undefined) {
    // Skills replacement: update job + delete old skills + create new skills atomically
    updatedJob = await prisma.$transaction(async (tx) => {
      const j = await tx.job.update({
        where: { id: params.id },
        data: jobFields,
      });
      await tx.jobSkill.deleteMany({ where: { jobId: params.id } });
      await tx.jobSkill.createMany({
        data: skills.map((s) => ({
          jobId: params.id,
          skillId: s.skillId,
          level: s.level ?? SkillLevel.INTERMEDIATE,
        })),
      });
      return j;
    });
    await invalidateJobSkillsCache(params.id);
  } else {
    // No skills change — update job fields only
    updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: jobFields,
    });
  }

  return NextResponse.json(updatedJob);
}

// DELETE /api/jobs/[id] — delete job (cascades to JobSkill, Application, JobMatch)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Security fix: Only recruiters can delete jobs
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden — recruiters only' }, { status: 403 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { recruiterId: true, _count: { select: { applications: true } } },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (job._count.applications > 0) {
    return NextResponse.json(
      { error: `Cannot delete job with ${job._count.applications} application(s). Close the job first.` },
      { status: 409 }
    );
  }

  await prisma.job.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
