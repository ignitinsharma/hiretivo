import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ResumeDocumentSchema } from "@/lib/validations/resume.schema";
import { ResumeStyleConfigSchema } from "@/lib/validations/resume-style.schema";

/*
 * POST /api/applications/:id/versions
 * Saves a manually-edited resume version with optional styleConfig.
 * Validates resumeJson against the resume schema and styleConfig against
 * the style config schema. Creates a new ResumeVersion with sourceType=manual-edit
 * and sets it as the active version.
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const resumeJson = body.resumeJson;
  const parsed = ResumeDocumentSchema.safeParse(resumeJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resume document", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Validate optional styleConfig; fall back to previous version's config
  const styleRaw = body.styleConfig;
  let styleConfig: unknown = undefined;
  if (styleRaw) {
    const styleParsed = ResumeStyleConfigSchema.safeParse(styleRaw);
    if (!styleParsed.success) {
      return NextResponse.json(
        { error: "Invalid style config", details: styleParsed.error.flatten() },
        { status: 422 },
      );
    }
    styleConfig = styleParsed.data;
  } else {
    // Carry styleConfig from active version when body omits it
    const activeSource = application.activeVersionId
      ? await prisma.resumeVersion.findUnique({
          where: { id: application.activeVersionId },
          select: { styleConfig: true },
        })
      : null;
    styleConfig = activeSource?.styleConfig ?? undefined;
  }

  // Count existing versions to set the next version number
  const versionCount = await prisma.resumeVersion.count({
    where: { applicationId: id },
  });

  const version = await prisma.resumeVersion.create({
    data: {
      applicationId: id,
      version: versionCount + 1,
      resumeJson: parsed.data,
      sourceType: "manual-edit",
      styleConfig: styleConfig as Prisma.InputJsonValue | undefined,
    },
  });

  // Set as active version
  await prisma.application.update({
    where: { id },
    data: { activeVersionId: version.id },
  });

  return NextResponse.json({
    id: version.id,
    version: version.version,
    sourceType: version.sourceType,
    createdAt: version.createdAt.toISOString(),
  });
}
