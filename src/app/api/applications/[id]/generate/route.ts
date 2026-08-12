import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { AutomationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { publishGenerationJob } from "@/lib/generation/qstash";
import { stripHtml } from "@/lib/utils";

const generateRequestSchema = z.object({
  jdText: z.string().optional(),
  forceGenerate: z.boolean().optional(),
  baseResumeJson: z.unknown().optional(),
});

/* Queues resume generation and returns before the AI worker starts. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: { id: true, automationStatus: true, job: { select: { description: true } } },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const masterResume = await prisma.masterResume.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!masterResume) {
    await prisma.application.update({
      where: { id },
      data: { automationStatus: AutomationStatus.FAILED, failureReason: "No master resume found — upload one first" },
    });
    return NextResponse.json({ error: "no_master_resume", message: "Upload your resume to get started" }, { status: 409 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = generateRequestSchema.safeParse(body);
  const jdText = (parsed.success ? parsed.data.jdText : undefined)?.trim() ||
    stripHtml(application.job.description ?? "").trim();
  const forceGenerate = request.nextUrl.searchParams.get("forceGenerate") === "true" ||
    (parsed.success ? parsed.data.forceGenerate ?? false : true);
  if (!jdText) {
    await prisma.application.update({
      where: { id },
      data: { automationStatus: AutomationStatus.FAILED, failureReason: "No job description available" },
    });
    return NextResponse.json({ error: "validation_error", message: "No job description available to generate from." }, { status: 422 });
  }

  const wordCount = jdText.split(/\s+/).length;
  if (wordCount < 5 && !forceGenerate) {
    return NextResponse.json({ error: "jd_too_short", wordCount }, { status: 422 });
  }

  if (application.automationStatus === AutomationStatus.GENERATING) {
    return NextResponse.json({ status: AutomationStatus.GENERATING }, { status: 202 });
  }

  const runId = randomUUID();
  await prisma.application.update({
    where: { id },
    data: {
      automationStatus: AutomationStatus.GENERATING,
      failureReason: null,
      automationRunId: runId,
      generationStartedAt: new Date(),
    },
  });

  try {
    await publishGenerationJob({
      applicationId: id,
      userId: session.user.id,
      runId,
      jdText,
      forceGenerate,
      baseResumeJson: parsed.success ? parsed.data.baseResumeJson : undefined,
    });
  } catch (error) {
    console.error("[generate] Failed to enqueue job:", error);
    await prisma.application.updateMany({
      where: { id, automationRunId: runId },
      data: { automationStatus: AutomationStatus.FAILED, failureReason: "Could not start resume generation" },
    });
    return NextResponse.json({ error: "queue_error", message: "Could not start resume generation" }, { status: 503 });
  }

  return NextResponse.json({ status: AutomationStatus.GENERATING, runId }, { status: 202 });
}
