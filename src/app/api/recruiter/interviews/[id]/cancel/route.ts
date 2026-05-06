import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InterviewStatus, UserRole } from "@/constants/enums";
import { sendInterviewCancelledEmail } from "@/lib/email/interview";
import { writeRateLimiter } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: { id: string };
}

/*
 * PATCH /api/recruiter/interviews/[id]/cancel
 * Cancels an owned recruiter interview and notifies the seeker.
 * Returns the cancelled interview id or auth/not-found/rate-limit errors.
 */
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

  await prisma.interview.update({
    where: { id: params.id },
    data: { status: InterviewStatus.CANCELLED },
  });

  // Cancelled email sent to seeker only (not recruiter) per D-15 — recruiter initiated the cancellation
  sendInterviewCancelledEmail({
    seekerEmail: existing.application.seeker.email ?? "",
    seekerName: existing.application.seeker.name ?? "Candidate",
    jobTitle: existing.application.job.title,
  }).catch((err: unknown) => {
    console.error("Failed to send interview cancelled email:", err);
  });

  return NextResponse.json({ data: { id: params.id } }, { status: 200 });
}
