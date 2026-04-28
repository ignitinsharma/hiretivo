import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationStatus, UserRole } from "@/constants/enums";
import { isValidStageTransition } from "@/lib/application-pipeline";
import { sendApplicationStatusEmail } from "@/lib/email/application-status";
import { prisma } from "@/lib/prisma";
import { updateApplicationStageSchema } from "@/lib/validations/application";
import { createRateLimiter } from "@/lib/rate-limit";

const stageUpdateRateLimiter = createRateLimiter("stage-update", 30, "1 m");

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

  // Rate limiting — 30 stage updates/min per recruiter
  const { success } = await stageUpdateRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateApplicationStageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      job: { select: { recruiterId: true, title: true } },
      seeker: { select: { name: true, email: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nextStage = parsed.data.stage;
  if (
    !isValidStageTransition(
      application.status as ApplicationStatus,
      nextStage as ApplicationStatus,
    )
  ) {
    return NextResponse.json(
      {
        error: `Invalid stage transition from ${application.status} to ${nextStage}`,
      },
      { status: 400 },
    );
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status: nextStage },
    select: {
      id: true,
      status: true,
      updatedAt: true,
    },
  });

  let notificationSent = false;
  if (application.seeker.email) {
    try {
      await sendApplicationStatusEmail({
        toEmail: application.seeker.email,
        candidateName: application.seeker.name ?? "there",
        jobTitle: application.job.title,
        stage: updated.status as ApplicationStatus,
      });
      notificationSent = true;
    } catch (error) {
      console.error("Failed to send application status email", {
        applicationId: updated.id,
        error,
      });
    }
  }

  return NextResponse.json({
    data: {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
      notificationSent,
    },
  });
}
