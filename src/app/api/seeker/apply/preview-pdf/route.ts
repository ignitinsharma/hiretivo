import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import { renderResumePdf } from "@/lib/resume/render";
import type { ResumeDocument } from "@/modules/seeker/profile/types/resume-document.types";

const previewPdfRateLimiter = createRateLimiter("seeker-preview-pdf", 20, "1 m");

/*
 * POST /api/seeker/apply/preview-pdf
 * Accepts a ResumeDocument, renders it to ATS-safe PDF via @react-pdf/renderer,
 * and returns the PDF as a download. This is a one-off render — nothing is
 * stored to R2. Used by the in-wizard "Download PDF" button so users can grab
 * their tailored resume as a file before finalizing.
 * @body { resume: ResumeDocument }
 * @returns application/pdf binary with Content-Disposition: attachment
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await previewPdfRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  let body: { resume?: ResumeDocument };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.resume || typeof body.resume.fullName !== "string") {
    return NextResponse.json({ error: "Missing or invalid resume document" }, { status: 400 });
  }

  const resume: ResumeDocument = body.resume;
  const pdf = await renderResumePdf(resume);

  const safeName = resume.fullName.replace(/[^a-zA-Z0-9 \-_]/g, "").trim() || "resume";
  const filename = `${safeName.replace(/\s+/g, "_")}_Tailored_Resume.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
