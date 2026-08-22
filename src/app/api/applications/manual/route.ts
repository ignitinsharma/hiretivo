import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JobStatus, UserRole, PipelineStage } from "@/constants/enums";
import { applyRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { externalApplicationSchema } from "@/lib/validations/external-application";

/*
 * POST /api/applications/manual
 * Alias for /log-external — keeps old clients working. See log-external for docs.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await applyRateLimiter.limit(ip);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== UserRole.SEEKER) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { success: userSuccess } = await writeRateLimiter.limit(session.user.id);
  if (!userSuccess) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = externalApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const { title, companyName, location, pipelineStage } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        title,
        description: "Manually tracked job — applied elsewhere",
        jobType: "FULL_TIME",
        applyType: "EXTERNAL",
        status: JobStatus.DRAFT,
        isManual: true,
        ownerId: session.user.id,
        companyName,
        location: location ?? null,
      },
    });

    const application = await tx.application.create({
      data: {
        jobId: job.id,
        seekerId: session.user.id,
        status: "APPLIED",
        matchScore: 0,
        pipelineStage: pipelineStage as PipelineStage,
      },
    });

    return { job, application };
  });

  return NextResponse.json({ id: result.application.id, jobId: result.job.id }, { status: 201 });
}
