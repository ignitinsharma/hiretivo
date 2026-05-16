/*
 * PATCH /api/recruiter/application/[id]/status
 * Moves an application to a new status column in the pipeline kanban.
 * Only the job's owning recruiter may update the status.
 * Auth: RECRUITER role + ownership check.
 * Rate limited: 10 req/min per user (write operation).
 * Body: { status: AppStatus }
 * Returns: { id, status } on success.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, APPLICATION_STATUS_VALUES } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUS_VALUES),
});

interface RouteContext {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      job: { select: { recruiterId: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });

  return NextResponse.json({ data: { id: updated.id, status: updated.status } });
}
