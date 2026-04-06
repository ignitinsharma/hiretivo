import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateJobSchema } from '@/lib/validations/job';

// PATCH /api/jobs/[id] — edit job fields or toggle status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  const parsed = updateJobSchema.omit({ id: true }).safeParse(body);
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
          level: s.level ?? 'INTERMEDIATE',
        })),
      });
      return j;
    });
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

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { recruiterId: true },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.job.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
