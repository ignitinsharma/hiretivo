import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { AutomationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/ai/resume-tailor";
import { stripHtml } from "@/lib/utils";

const generateRequestSchema = z.object({
  jdText: z.string().optional(),
  forceGenerate: z.boolean().optional(),
  baseResumeJson: z.any().optional(),
});

/*
 * POST /api/applications/:id/generate
 * Generates a tailored resume for the given application.
 * Thin wrapper around tailorResume() — handles auth, ownership checks, and HTTP mapping.
 * Reused for Regenerate (version-increment logic lives inside tailorResume()).
 * If jdText is not provided, uses the job's stored description.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch Application with job, confirm it belongs to this user
  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: {
      id: true,
      job: {
        select: {
          title: true,
          description: true,
          skills: { select: { skill: { select: { name: true } } } },
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const jobSkills: string[] =
    application.job.skills?.map((js) => js.skill.name) ?? [];

  // Check MasterResume exists
  const masterResume = await prisma.masterResume.findUnique({
    where: { userId: session.user.id },
  });

  if (!masterResume) {
    await prisma.application.update({
      where: { id },
      data: { automationStatus: AutomationStatus.FAILED, failureReason: "No master resume found — upload one first" },
    });
    return NextResponse.json(
      { error: "no_master_resume", message: "Upload your resume to get started" },
      { status: 409 },
    );
  }

  // Resolve jdText — from body or job description
  let jdText: string;
  let forceGenerate = false;
  let baseResumeJson: unknown = undefined;

  try {
    const body = await request.json();
    const parsed = generateRequestSchema.safeParse(body);
    if (!parsed.success && !body?.jdText) {
      // No body provided or missing jdText — use job description
      jdText = application.job.description
        ? stripHtml(application.job.description).trim()
        : "";
      forceGenerate = true;
    } else if (parsed.success) {
      jdText = parsed.data.jdText?.trim() ?? "";
      forceGenerate = parsed.data.forceGenerate ?? false;
      baseResumeJson = parsed.data.baseResumeJson;
      if (!jdText && application.job.description) {
        jdText = stripHtml(application.job.description).trim();
        forceGenerate = true;
      }
    } else {
      jdText = application.job.description
        ? stripHtml(application.job.description).trim()
        : "";
      forceGenerate = true;
    }
  } catch {
    // JSON parse failed — use job description
    jdText = application.job.description
      ? stripHtml(application.job.description).trim()
      : "";
    forceGenerate = true;
  }

  if (!jdText) {
    await prisma.application.update({
      where: { id },
      data: { automationStatus: AutomationStatus.FAILED, failureReason: "No job description available" },
    });
    return NextResponse.json(
      { error: "validation_error", message: "No job description available to generate from." },
      { status: 422 },
    );
  }

  // JD text quality check — warn if too short but allow override with forceGenerate
  const wordCount = jdText.split(/\s+/).length;
  if (wordCount < 5 && !forceGenerate) {
    return NextResponse.json(
      { error: "jd_too_short", message: "Job description seems too short (<5 words). Add more detail or use forceGenerate to proceed anyway.", wordCount },
      { status: 422 },
    );
  }

  // Set status to GENERATING
  await prisma.application.update({
    where: { id },
    data: { automationStatus: AutomationStatus.GENERATING },
  });

  // Call the core tailoring function
  const resolvedBaseResume = (baseResumeJson ?? masterResume.resumeJson) as unknown as import("@/lib/validations/resume.schema").ResumeDocument;
  const result = await tailorResume({
    userId: session.user.id,
    applicationId: id,
    masterResumeJson: resolvedBaseResume,
    jdText,
    jobSkills,
    jobTitle: application.job.title,
  });

  // Map result to HTTP response
  switch (result.status) {
    case "success":
      await prisma.application.update({
        where: { id },
        data: { automationStatus: AutomationStatus.READY },
      });
      return NextResponse.json({
        resumeVersionId: result.resumeVersion.id,
        version: result.resumeVersion.version,
        resumeJson: result.resumeVersion.resumeJson,
        matchMeta: result.resumeVersion.matchMeta,
      });

    case "quota_exceeded":
      return NextResponse.json(
        { error: "quota_exceeded", used: result.used, limit: result.limit, resetsAt: result.resetsAt },
        { status: 402 },
      );

    case "rate_limited":
      return NextResponse.json(
        { error: "rate_limited", retryAfterSeconds: result.retryAfterSeconds },
        { status: 429 },
      );

    case "ai_error":
    case "validation_error":
      await prisma.application.update({
        where: { id },
        data: { automationStatus: AutomationStatus.FAILED, failureReason: "AI generation failed — please retry" },
      });
      return NextResponse.json(
        { error: result.status === "ai_error" ? "ai_error" : "validation_error", message: "We couldn't generate your resume right now. Please try again." },
        { status: 422 },
      );
  }
}
