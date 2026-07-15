import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tailorResume } from "@/lib/ai/resume-tailor";

const generateRequestSchema = z.object({
  jdText: z.string().min(1, "JD text is required"),
  forceGenerate: z.boolean().optional(),
});

/*
 * POST /api/applications/:id/generate
 * Generates a tailored resume for the given application.
 * Thin wrapper around tailorResume() — handles auth, ownership checks, and HTTP mapping.
 * Reused for Regenerate (version-increment logic lives inside tailorResume()).
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

  // Fetch Application, confirm it belongs to this user
  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: { id: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Check MasterResume exists
  const masterResume = await prisma.masterResume.findUnique({
    where: { userId: session.user.id },
  });

  if (!masterResume) {
    return NextResponse.json(
      { error: "no_master_resume", message: "Upload your resume to get started" },
      { status: 409 },
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", message: parsed.error.flatten().fieldErrors?.jdText?.[0] ?? "Invalid request" },
      { status: 422 },
    );
  }

  // JD text quality check — warn if too short but allow override with forceGenerate
  const wordCount = parsed.data.jdText.trim().split(/\s+/).length;
  if (wordCount < 50 && !parsed.data.forceGenerate) {
    return NextResponse.json(
      { error: "jd_too_short", message: "Job description seems too short (<50 words). Add more detail or use forceGenerate to proceed anyway.", wordCount },
      { status: 422 },
    );
  }

  // Call the core tailoring function
  const result = await tailorResume({
    userId: session.user.id,
    applicationId: id,
    masterResumeJson: masterResume.resumeJson as unknown as import("@/lib/validations/resume.schema").ResumeDocument,
    jdText: parsed.data.jdText,
  });

  // Map result to HTTP response
  switch (result.status) {
    case "success":
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
      return NextResponse.json(
        { error: result.status === "ai_error" ? "ai_error" : "validation_error", message: "We couldn't generate your resume right now. Please try again." },
        { status: 422 },
      );
  }
}
