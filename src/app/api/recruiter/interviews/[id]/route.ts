import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InterviewStatus, PlanTier, UserRole } from "@/constants/enums";
import { ScheduleInterviewSchema } from "@/lib/validations/interview.schema";
import { sendInterviewRescheduledEmail } from "@/lib/email/interview";
import { NextRequest, NextResponse } from "next/server";

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

  // Plan gate (D-07): see POST route comment — gate checks FREE only (no STARTER enum value)
  if (session.user.plan === PlanTier.FREE) {
    return NextResponse.json(
      { error: "Scheduling is available on Pro plan. Contact support to upgrade." },
      { status: 403 },
    );
  }

  const body: unknown = await req.json().catch(() => null);
  // Reschedule reuses ScheduleInterviewSchema minus applicationId (not needed for update)
  const partialSchema = ScheduleInterviewSchema.omit({ applicationId: true });
  const parsed = partialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.interview.findFirst({
    where: { id: params.id, recruiterId: session.user.id },
    include: {
      application: {
        include: {
          job: { select: { title: true } },
          seeker: { select: { email: true, name: true } },
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

  const { startsAt, endsAt, meetLink, notes } = parsed.data;

  const updated = await prisma.interview.update({
    where: { id: params.id },
    data: {
      status: InterviewStatus.SCHEDULED,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      meetLink: meetLink ?? null,
      notes: notes !== undefined ? notes : existing.notes,
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
  }).catch((err: unknown) => {
    console.error("Failed to send interview rescheduled email:", err);
  });

  return NextResponse.json({ data: updated }, { status: 200 });
}
