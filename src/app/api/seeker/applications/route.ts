import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationStatus, ApplySource, JobStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";
import { createApplicationWizardSchema } from "@/lib/validations/application.schema";

/*
 * isPrismaUniqueConstraintError
 * Detects a Prisma unique-constraint violation (P2002) without `any`.
 */
function isPrismaUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/*
 * POST /api/seeker/applications
 * Starts an apply-wizard run against a feed job: creates the Application row
 * the wizard tailors artifacts onto. Dedups on `@@unique([jobId, seekerId])` —
 * a second call for the same job returns 409 with the existing id so the
 * caller can route into that run instead of starting a duplicate.
 * > DEVIATION: AppStatus has no draft/in-progress member (DATA-MODEL is
 * canon and doesn't define one), so this row is created with the schema
 * default `status: APPLIED` immediately, before the wizard's finalize step
 * (Task 8) actually submits anything. The row's real "was this submitted"
 * signal is `tailoredResumeKey`/`submittedFormData` being non-null, not
 * `status` — Phase 6's tracker must filter on that, not on status alone.
 * Request body: createApplicationWizardSchema. Response: {data:{id}} 201,
 * or {error, id} 409 when a run already exists for this job.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createApplicationWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { jobId } = parsed.data;
  const seekerId = session.user.id;

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: JobStatus.OPEN },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found or closed" }, { status: 404 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: seekerId },
    select: { id: true },
  });
  let matchScore = 0;
  if (seekerProfile) {
    const jobMatch = await prisma.jobMatch.findUnique({
      where: { jobId_seekerProfileId: { jobId, seekerProfileId: seekerProfile.id } },
      select: { score: true },
    });
    matchScore = jobMatch?.score ?? 0;
  }

  try {
    const application = await prisma.application.create({
      data: {
        jobId,
        seekerId,
        source: ApplySource.FEED,
        status: ApplicationStatus.APPLIED,
        matchScore,
      },
      select: { id: true },
    });
    return NextResponse.json({ data: { id: application.id } }, { status: 201 });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      const existing = await prisma.application.findUnique({
        where: { jobId_seekerId: { jobId, seekerId } },
        select: { id: true },
      });
      return NextResponse.json(
        { error: "You already have an application for this job", id: existing?.id ?? null },
        { status: 409 },
      );
    }
    throw error;
  }
}
