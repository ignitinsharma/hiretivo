import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { JobStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: {
    jobId: string;
  };
}

export async function POST(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.savedJob.deleteMany({
    where: {
      userId: session.user.id,
      jobId: params.jobId,
    },
  });

  return NextResponse.json({ data: { ok: true } });
}
