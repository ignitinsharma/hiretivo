import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openrouter, getResumeModel } from "@/lib/openrouter";
import { withRetry } from "@/lib/ai/with-retry";
import { ResumeDocumentSchema } from "@/lib/validations/resume.schema";
import type { ResumeDocument } from "@/lib/validations/resume.schema";

const REWRITE_CONFIG = { max_tokens: 8192, temperature: 0.5 } as const;
const MAX_EDITS_PER_GENERATION = 5;

/*
 * POST /api/applications/:id/rewrite
 * Rewrites the active resume version following a user instruction.
 * Creates a new ResumeVersion with sourceType=manual-edit.
 * Capped at 5 edits per generation.
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

  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: { id: true, activeVersionId: true },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  let body: { instruction?: string; resumeJson?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.instruction?.trim()) {
    return NextResponse.json({ error: "Instruction is required" }, { status: 400 });
  }

  // Fetch current version
  const currentVersion = application.activeVersionId
    ? await prisma.resumeVersion.findUnique({ where: { id: application.activeVersionId } })
    : null;

  const sourceJson = (body.resumeJson ?? currentVersion?.resumeJson) as ResumeDocument | undefined;
  if (!sourceJson) {
    return NextResponse.json({ error: "No resume to rewrite" }, { status: 400 });
  }

  // Count edits on this application
  const editCount = await prisma.resumeVersion.count({
    where: { applicationId: id, sourceType: "manual-edit" },
  });
  if (editCount >= MAX_EDITS_PER_GENERATION) {
    return NextResponse.json(
      { error: "Maximum edits reached (5 per generation). Save as a new version instead." },
      { status: 400 },
    );
  }

  const systemPrompt = `You are a professional resume editor. Rewrite the given resume JSON following the user's instruction exactly.

Rules:
- Return ONLY a valid JSON object matching the input schema — no markdown, no code fences, no explanation
- Preserve all fields unless the instruction explicitly asks to change them
- Keep the exact same schema structure — only modify content
- Do not fabricate experience, education, or other credentials not present in the input
- The "id" fields should remain exactly as provided (do not regenerate them)`;

  const rewriteResponse = await withRetry(async () => {
    const completion = await openrouter.chat.completions.create({
      model: getResumeModel(),
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Instruction: ${body.instruction}\n\nResume JSON:\n${JSON.stringify(sourceJson, null, 2)}`,
        },
      ],
      ...REWRITE_CONFIG,
    });
    return completion.choices?.[0]?.message?.content ?? null;
  });

  if (!rewriteResponse) {
    return NextResponse.json(
      { error: "ai_error", message: "Failed to rewrite resume. Please try again." },
      { status: 422 },
    );
  }

  let rewritten: ResumeDocument;
  try {
    const cleaned = rewriteResponse
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned);
    const validation = ResumeDocumentSchema.safeParse(parsed);
    if (!validation.success) {
      return NextResponse.json(
        { error: "validation_error", message: "AI returned an invalid resume. Please try again." },
        { status: 422 },
      );
    }
    rewritten = validation.data;
  } catch {
    return NextResponse.json(
      { error: "ai_error", message: "Failed to parse AI response. Please try again." },
      { status: 422 },
    );
  }

  // Save as a new version
  const versionCount = await prisma.resumeVersion.count({
    where: { applicationId: id },
  });

  const version = await prisma.resumeVersion.create({
    data: {
      applicationId: id,
      version: versionCount + 1,
      resumeJson: rewritten,
      sourceType: "manual-edit",
    },
  });

  await prisma.application.update({
    where: { id },
    data: { activeVersionId: version.id },
  });

  return NextResponse.json({
    id: version.id,
    version: version.version,
    resumeJson: rewritten,
    previousResumeJson: sourceJson,
  });
}
