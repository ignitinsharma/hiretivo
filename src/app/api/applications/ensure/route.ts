import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus, UserRole, VerificationStatus, PipelineStage } from "@/constants/enums";
import { ApplicationStatus } from "@/constants/enums";
import { applyRateLimiter, writeRateLimiter } from "@/lib/rate-limit";

/*
 * POST /api/applications/ensure
 * Idempotent ensure: if seeker already has an Application for jobId, returns it (200).
 * Otherwise creates one with pipelineStage NOT_APPLIED (shows in Tracker's first column, not Applied).
 * Used by Browse drawer's Generate Resume — background generation without auto-promoting to APPLIED.
 */

const ensureSchema = z.object({
  jobId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await applyRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success: userSuccess } = await writeRateLimiter.limit(session.user.id);
  if (!userSuccess) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const seekerUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true },
  });
  if (seekerUser?.verificationStatus !== VerificationStatus.VERIFIED) {
    return NextResponse.json({ error: "Complete verification to generate resumes" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ensureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const { jobId } = parsed.data;

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: JobStatus.OPEN },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found or closed" }, { status: 404 });
  }

  const existing = await prisma.application.findUnique({
    where: { jobId_seekerId: { jobId, seekerId: session.user.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id }, { status: 200 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, resumeKey: true },
  });
  if (!seekerProfile?.resumeKey) {
    return NextResponse.json({ error: "Upload your resume in Settings before generating. Go to /settings to continue." }, { status: 400 });
  }

  let matchScore = 0;
  const jobMatch = await prisma.jobMatch.findUnique({
    where: { jobId_seekerProfileId: { jobId, seekerProfileId: seekerProfile.id } },
  });
  matchScore = jobMatch?.score ?? 0;

  const application = await prisma.application.create({
    data: {
      jobId,
      seekerId: session.user.id,
      status: ApplicationStatus.APPLIED,
      pipelineStage: PipelineStage.NOT_APPLIED,
      matchScore,
    },
  });

  return NextResponse.json({ id: application.id }, { status: 201 });
}
