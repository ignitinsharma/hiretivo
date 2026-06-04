import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InterviewStatus, PlanTier, UserRole } from "@/constants/enums";
import { RescheduleInterviewSchema } from "@/lib/validations/interview.schema";
import { sendInterviewRescheduledEmail } from "@/lib/email/interview";
import { normalizeTimezone } from "@/lib/timezone";
import { writeRateLimiter } from "@/lib/rate-limit";
import { isRecruiterTrialActive } from "@/lib/recruiter-trial";
import { INDIA_TIMEZONE } from "@/modules/india-location";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: { id: string } | Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Interview id is required" }, { status: 400 });
  }

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

  if (session.user.plan === PlanTier.FREE && !isRecruiterTrialActive()) {
    return NextResponse.json(
      { error: "Interview scheduling requires Pro plan. Upgrade to unlock." },
      { status: 403 },
    );
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = RescheduleInterviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await prisma.interview.findFirst({
      where: { id, recruiterId: session.user.id },
      include: {
        application: {
          include: {
            job: { select: { title: true } },
            seeker: { select: { email: true, name: true, timezone: true } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const recruiter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const { startsAt, endsAt, meetLink, notes, scheduledTimeZone } = parsed.data;
    const normalizedScheduledTimeZone = scheduledTimeZone
      ? normalizeTimezone(scheduledTimeZone)
      : existing.scheduledTimeZone;

    const updated = await prisma.interview.update({
      where: { id },
      data: {
        status: InterviewStatus.SCHEDULED,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        meetLink: meetLink ?? null,
        notes: notes !== undefined ? notes : existing.notes,
        scheduledTimeZone: normalizedScheduledTimeZone ?? null,
      },
    });

    sendInterviewRescheduledEmail({
      recruiterEmail: recruiter?.email ?? "",
      seekerEmail: existing.application.seeker.email ?? "",
      seekerName: existing.application.seeker.name ?? "Candidate",
      jobTitle: existing.application.job.title,
      startsAt: updated.startsAt ?? new Date(startsAt),
      endsAt: updated.endsAt ?? new Date(endsAt),
      meetLink: updated.meetLink,
      scheduledTimeZone: updated.scheduledTimeZone ?? null,
      viewerTimezone: existing.application.seeker.timezone ?? INDIA_TIMEZONE,
    }).catch((err: unknown) => {
      console.error("Failed to send interview rescheduled email:", err);
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    console.error("Interview reschedule failed:", err);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          error: "Internal server error",
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}