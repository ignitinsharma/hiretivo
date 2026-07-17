import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ResumeDocumentSchema } from "@/lib/validations/resume.schema";

/*
 * POST /api/applications/:id/versions
 * Saves a manually-edited resume version.
 * Validates against Phase 0 schema, creates new ResumeVersion with sourceType=manual-edit,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const resumeJson = (body as Record<string, unknown>)?.resumeJson;
  const parsed = ResumeDocumentSchema.safeParse(resumeJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resume document", details: parsed.error.flatten() },
      { status: 422 },
    );
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
