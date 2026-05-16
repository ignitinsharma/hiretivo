import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/resend";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const InviteSchema = z.object({
  jobId: z.string().min(1),
  note: z.string().max(500).optional(),
});

/*
 * POST /api/recruiter/talent/[id]/invite
 * Creates a RECRUITER_INITIATED application (interview invite from talent pool).
 * Requires EngineerUnlock to exist for this recruiter+engineer pair.
 * Returns 400 NO_OPEN_JOBS if recruiter has no OPEN jobs.
 * Returns 409 ALREADY_APPLIED if Application already exists for this job+engineer.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.RECRUITER) return new Response("Forbidden", { status: 403 });

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  const body = await req.json().catch(() => ({}));
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { jobId } = parsed.data;

  // Must have existing unlock
  const unlock = await prisma.engineerUnlock.findUnique({
    where: { recruiterId_engineerId: { recruiterId: session.user.id, engineerId: params.id } },
  });
  if (!unlock) {
    return NextResponse.json({ code: "NOT_UNLOCKED" }, { status: 403 });
  }

  // Check job is OPEN and owned by recruiter
  const job = await prisma.job.findFirst({
    where: { id: jobId, recruiterId: session.user.id, status: "OPEN" },
    select: { id: true, title: true },
  });
  if (!job) {
    // Check if recruiter has ANY open jobs
    const openJobCount = await prisma.job.count({ where: { recruiterId: session.user.id, status: "OPEN" } });
    if (openJobCount === 0) {
      return NextResponse.json({ code: "NO_OPEN_JOBS" }, { status: 400 });
    }
    return NextResponse.json({ error: "Job not found or not open" }, { status: 404 });
  }

  // Check duplicate application
  const existing = await prisma.application.findUnique({
    where: { jobId_seekerId: { jobId, seekerId: params.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ code: "ALREADY_APPLIED", applicationId: existing.id }, { status: 409 });
  }

  // Load engineer for email
  const engineer = await prisma.user.findUnique({
    where: { id: params.id },
    select: { name: true, email: true },
  });
  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { recruiterProfile: { select: { companyName: true } } },
  });

  // Create application
  const application = await prisma.application.create({
    data: {
      jobId,
      seekerId: params.id,
      source: "RECRUITER_INITIATED",
      status: "APPLIED",
      matchScore: 0, // Phase 11 will compute real score
    },
  });

  // Fire-and-forget invite email
  const companyName = recruiter?.recruiterProfile?.companyName ?? "A recruiter";
  sendEmail({
    from: "Hiretivo <noreply@hiretivo.com>",
    to: engineer?.email ?? "",
    subject: `You've been invited to interview at ${companyName}`,
    html: `<p>Hi ${engineer?.name ?? "Engineer"},</p><p>You've been invited to interview at <strong>${companyName}</strong> for the role of <strong>${job.title}</strong>.</p><p><a href="https://hiretivo.com/seeker/applications">View invitation →</a></p>`,
    text: `Hi ${engineer?.name ?? "Engineer"},\n\nYou've been invited to interview at ${companyName} for ${job.title}.\n\nhttps://hiretivo.com/seeker/applications`,
  }).catch(() => { /* non-critical */ });

  return NextResponse.json({ data: { applicationId: application.id } }, { status: 201 });
}
