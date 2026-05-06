import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateJobBaseSchema } from '@/lib/validations/job';
import { invalidateJobSkillsCache } from '@/lib/match';
import { JobStatus, SkillLevel, UserRole } from '@/constants/enums';
import { requireVerifiedEmailForTrustedAction } from '@/lib/auth/email-verification';
import { writeRateLimiter } from '@/lib/rate-limit';

/*
 * PATCH /api/recruiter/jobs/[id]
 * Updates an owned recruiter job and refreshes skill cache when needed.
 * Returns the updated job or auth/ownership/validation/rate-limit errors.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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

  const parsed = updateJobBaseSchema.omit({ id: true }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    );
  }

  const { skills, ...jobFields } = parsed.data;

  if (jobFields.status === JobStatus.OPEN) {
    const verificationError = await requireVerifiedEmailForTrustedAction(
      session.user.id,
    );
    if (verificationError) return verificationError;
  }

  let updatedJob;
  if (skills !== undefined) {
    updatedJob = await prisma.$transaction(async (tx) => {
      const j = await tx.job.update({ where: { id: params.id }, data: jobFields });
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
    updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: jobFields,
    });
    if (jobFields.status !== undefined) {
      await invalidateJobSkillsCache(params.id);
    }
  }

  return NextResponse.json({ data: updatedJob });
}

/*
 * DELETE /api/recruiter/jobs/[id]
 * Soft-deletes an owned recruiter job by marking it deleted.
 * Returns success or auth/ownership/rate-limit errors.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { recruiterId: true },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.job.update({
    where: { id: params.id },
    data: { status: JobStatus.DELETED, closedAt: new Date() },
  });
  return NextResponse.json({ data: { success: true } });
}
