import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderResumePdf } from "@/lib/resume/style/render-pdf";
import { ResumeDocumentSchema } from "@/lib/validations/resume.schema";
import { ResumeStyleConfigSchema, resolveStyle } from "@/lib/validations/resume-style.schema";

/*
 * GET /api/applications/:id/download
 * Returns the active ResumeVersion as a PDF attachment.
 * Enriches with current SeekerProfile links so download always reflects latest profile.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: {
      id: true,
      activeVersionId: true,
      job: { select: { title: true, companyName: true } },
      resumeVersions: {
        where: {},
        orderBy: { version: "desc" },
        select: { id: true, resumeJson: true, styleConfig: true },
        take: 10,
      },
    },
  });
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  const active = application.resumeVersions.find((v) => v.id === application.activeVersionId) ?? application.resumeVersions[0];
  if (!active?.resumeJson) return NextResponse.json({ error: "No resume version ready" }, { status: 404 });

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { linkedinUrl: true, githubUrl: true, websiteUrl: true },
  });

  const rawDoc = active.resumeJson as Record<string, unknown>;
  const personalInfo = (rawDoc.personalInfo as Record<string, unknown> | undefined) ?? {};
  const enrichedDoc = {
    ...rawDoc,
    personalInfo: {
      ...personalInfo,
      linkedin: (personalInfo.linkedin as string) || seekerProfile?.linkedinUrl || null,
      github: (personalInfo.github as string) || seekerProfile?.githubUrl || null,
      websiteUrl: (personalInfo.websiteUrl as string) || seekerProfile?.websiteUrl || null,
    },
  };

  const parsed = ResumeDocumentSchema.safeParse(enrichedDoc);
  if (!parsed.success) return NextResponse.json({ error: "Invalid resume document" }, { status: 500 });

  const configParsed = ResumeStyleConfigSchema.safeParse(active.styleConfig);
  const styleConfig = configParsed.success ? configParsed.data : resolveStyle(undefined);

  const pdf = await renderResumePdf(parsed.data, styleConfig);

  const company = (application.job.companyName ?? "").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const title = application.job.title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "");
  const filename = company ? `${company}_${title}_Resume.pdf` : `${title}_Resume.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
