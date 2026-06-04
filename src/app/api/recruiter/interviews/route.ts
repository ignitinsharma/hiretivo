import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InterviewStatus, PlanTier, UserRole } from "@/constants/enums";
import { ScheduleInterviewSchema } from "@/lib/validations/interview.schema";
import { normalizeTimezone } from "@/lib/timezone";
import { isRecruiterTrialActive } from "@/lib/recruiter-trial";
import { sendInterviewScheduledEmail } from "@/lib/email/interview-scheduled";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Rate limit by userId (CLAUDE.md §9.4 — 10 req/min per userId)
  const { success } = await ratelimit.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      plan: true,
      recruiterProfile: { select: { companyName: true } },
    },
  });

  if (!recruiter) {
    return NextResponse.json({ error: "Recruiter not found" }, { status: 404 });
  }

  const canAccessInterviewScheduling = (plan: string | null | undefined): boolean => {
    return plan === PlanTier.STARTER || plan === PlanTier.GROWTH || plan === PlanTier.SCALE || isRecruiterTrialActive();
  };

  if (!canAccessInterviewScheduling(recruiter.plan)) {
    return NextResponse.json(
      { error: "Interview scheduling requires Pro plan. Upgrade to unlock." },
      { status: 403 },
    );
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = ScheduleInterviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { applicationId, startsAt, endsAt, meetLink, notes, scheduledTimeZone } = parsed.data;
  const normalizedScheduledTimeZone = scheduledTimeZone
    ? normalizeTimezone(scheduledTimeZone)
    : null;

  // Verify this application belongs to this recruiter
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      job: { recruiterId: session.user.id },
    },
    include: {
      job: { select: { title: true } },
      seeker: { select: { email: true, name: true, timezone: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const interview = await prisma.interview.create({
    data: {
      applicationId,
      recruiterId: session.user.id,
      seekerId: application.seekerId,
      status: InterviewStatus.SCHEDULED,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      meetLink: meetLink || null,
      notes: notes ?? null,
      scheduledTimeZone: normalizedScheduledTimeZone,
    },
  });

  // Send email (non-blocking — do not fail the request if email fails)
  sendInterviewScheduledEmail({
    seekerEmail: application.seeker.email ?? "",
    seekerName: application.seeker.name ?? "Candidate",
    jobTitle: application.job.title,
    companyName: recruiter.recruiterProfile?.companyName ?? "Hiretivo recruiter",
    startsAt: interview.startsAt ?? new Date(startsAt),
    endsAt: interview.endsAt ?? new Date(endsAt),
    meetLink: interview.meetLink,
    notes: interview.notes,
    scheduledTimeZone: interview.scheduledTimeZone ?? null,
    viewerTimezone: application.seeker.timezone ?? null,
  }).catch((err: unknown) => {
    console.error("Failed to send interview scheduled email:", err);
  });

  return NextResponse.json({ data: interview }, { status: 201 });
}
