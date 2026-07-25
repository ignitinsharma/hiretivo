import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createRateLimiter } from "@/lib/rate-limit";
import { renderAtsResume } from "@/lib/resume/ats-render";
import { ResumeDocumentSchema } from "@/lib/validations/resume.schema";

const previewPdfRateLimiter = createRateLimiter("resume-preview-pdf", 20, "1 m");

/*
 * POST /api/resume/preview-pdf
 * Accepts a Phase 0 ResumeDocument, renders it to ATS-safe single-page PDF
 * with fit-to-one-page logic (shrink-then-trim), and returns the PDF.
 * Returns trim info so the UI can show "Trimmed N bullets" notice.
 *
 * @body { resumeJson: ResumeDocument }
 * @returns application/pdf binary
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await previewPdfRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawResume = (body as Record<string, unknown>)?.resumeJson;
  const parsed = ResumeDocumentSchema.safeParse(rawResume);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resume document", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { pdf, trimmedBullets } = await renderAtsResume(parsed.data);

  const safeName = parsed.data.personalInfo.name.replace(/[^a-zA-Z0-9 \-_]/g, "").trim() || "resume";
  const filename = `${safeName.replace(/\s+/g, "_")}_Tailored_Resume.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Trimmed-Bullets": String(trimmedBullets),
    },
  });
}
