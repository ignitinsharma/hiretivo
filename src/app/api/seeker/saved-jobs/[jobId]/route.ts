import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { JobStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";

interface RouteContext {
  params: {
    jobId: string;
  };
}

/*
 * POST /api/seeker/saved-jobs/[jobId]
 * Saves an open job for the authenticated seeker.
 * Returns the saved-job id or auth/not-found/rate-limit errors.
 */
export async function POST(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const job = await prisma.job.findFirst({
    where: { id: params.jobId, status: JobStatus.OPEN },
    select: { id: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const savedJob = await prisma.savedJob.upsert({
    where: {
      userId_jobId: {
        userId: session.user.id,
        jobId: params.jobId,
      },
    },
    create: {
      userId: session.user.id,
      jobId: params.jobId,
    },
    update: {},
  });

  return NextResponse.json({ data: { id: savedJob.id } }, { status: 201 });
}

/*
 * DELETE /api/seeker/saved-jobs/[jobId]
 * Removes a saved job for the authenticated seeker.
 * Returns an ok payload or auth/rate-limit errors.
 */
export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await prisma.savedJob.deleteMany({
    where: {
      userId: session.user.id,
      jobId: params.jobId,
    },
  });

  return NextResponse.json({ data: { ok: true } });
}
