import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ApplyType,
  JobStatus,
  JobType,
  UserRole,
  VerificationStatus,
} from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { applyRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { createManualApplicationSchema } from "@/lib/validations/manual-application";

/*
 * POST /api/applications/manual
 * Creates a manually tracked job + application for an authenticated seeker.
 * The Job is created as DRAFT so it never surfaces in public feeds.
 * Returns the created application id or auth/validation/rate-limit errors.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success: ipSuccess } = await applyRateLimiter.limit(ip);
  if (!ipSuccess) {
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
    return NextResponse.json(
      { error: "Complete verification to track jobs" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createManualApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { title, companyName, location, pipelineStage } = parsed.data;

  const application = await prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        title,
        companyName,
        location: location ?? null,
        description: "Manually tracked job",
        jobType: JobType.FULL_TIME,
        applyType: ApplyType.EXTERNAL,
        status: JobStatus.DRAFT,
        isManual: true,
        ownerId: session.user.id,
      },
    });

    return tx.application.create({
      data: {
        jobId: job.id,
        seekerId: session.user.id,
        matchScore: 0,
        pipelineStage,
      },
    });
  });

  return NextResponse.json({ id: application.id }, { status: 201 });
}
