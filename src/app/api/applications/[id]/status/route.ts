import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { APPLICATION_STATUS_VALUES, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { resolveAutomationStatus } from "@/lib/generation/automation-status";

/*
 * GET /api/applications/:id/status
 * Lightweight polling endpoint — returns only generation status so the UI can
 * poll quickly (2s) while a resume generates, without the heavy nested query
 * from the full application detail route.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: {
      automationStatus: true,
      failureReason: true,
      automationRunId: true,
      generationStartedAt: true,
      generationCount: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const { automationStatus, failureReason } = await resolveAutomationStatus(
    application,
    id,
    session.user.id,
  );

  return NextResponse.json({
    automationStatus,
    failureReason,
    generationCount: application.generationCount,
  });
}

const statusUpdateSchema = z.object({
  status: z.enum(APPLICATION_STATUS_VALUES),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status value", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: { id: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  await prisma.application.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ success: true });
}
