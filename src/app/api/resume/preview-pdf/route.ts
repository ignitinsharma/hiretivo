import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createRateLimiter } from "@/lib/rate-limit";
import { renderResumePdf } from "@/lib/resume/style/render-pdf";
import { ResumeDocumentSchema } from "@/lib/validations/resume.schema";
import {
  ResumeStyleConfigSchema,
  resolveStyle,
} from "@/lib/validations/resume-style.schema";

const previewPdfRateLimiter = createRateLimiter("resume-preview-pdf", 20, "1 m");

/*
 * POST /api/resume/preview-pdf
 * Accepts a ResumeDocument (and optional styleConfig) and renders the PDF
 * with the same render tree as the on-screen preview — download matches
 * preview exactly. Highlight opts are never passed, so the PDF has no
 * green backgrounds.
 *
 * @body { resumeJson: ResumeDocument, styleConfig?: ResumeStyleConfig }
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

  const rawConfig = (body as Record<string, unknown>)?.styleConfig;
  const configParsed = ResumeStyleConfigSchema.safeParse(rawConfig);
  const styleConfig = configParsed.success
    ? configParsed.data
    : resolveStyle(undefined);

  const pdf = await renderResumePdf(parsed.data, styleConfig);

  const safeName = parsed.data.personalInfo.name.replace(/[^a-zA-Z0-9 \-_]/g, "").trim() || "resume";
  const filename = `${safeName.replace(/\s+/g, "_")}_Tailored_Resume.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
