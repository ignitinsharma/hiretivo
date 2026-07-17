import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AutomationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { generateCoverLetter } from "@/lib/ai/cover-letter-generator";
import { ResumeDocumentSchema } from "@/lib/validations/resume.schema";

/*
 * GET /api/applications/:id/cover-letter
 * Returns the current cover letter for an application, if one exists.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, seekerId: session.user.id },
    select: { id: true },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const coverLetter = await prisma.coverLetter.findFirst({
    where: { applicationId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, content: true, createdAt: true },
  });

  return NextResponse.json(coverLetter ?? { content: null });
}

/*
 * POST /api/applications/:id/cover-letter
 * Generates a cover letter for the application using the tailored resume + job description.
 * Persists to the CoverLetter model.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      automationStatus: true,
      job: { select: { title: true, description: true, companyName: true } },
    },
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.automationStatus !== AutomationStatus.READY) {
    return NextResponse.json(
      { error: "Resume generation must complete before generating a cover letter." },
      { status: 400 },
    );
  }

  // Get the active resume version
  if (!application.activeVersionId) {
    return NextResponse.json(
      { error: "No resume version found. Generate a resume first." },
      { status: 400 },
    );
  }

  const resumeVersion = await prisma.resumeVersion.findUnique({
    where: { id: application.activeVersionId },
    select: { resumeJson: true },
  });
  if (!resumeVersion) {
    return NextResponse.json(
      { error: "Resume version not found." },
      { status: 400 },
    );
  }

  const jdText = application.job.description?.trim();
  if (!jdText) {
    return NextResponse.json(
      { error: "No job description available for cover letter generation." },
      { status: 400 },
    );
  }

  const parsed = ResumeDocumentSchema.safeParse(resumeVersion.resumeJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resume document on file." },
      { status: 500 },
    );
  }

  const result = await generateCoverLetter(
    parsed.data,
    jdText,
    application.job.title,
    application.job.companyName ?? "Company",
  );

  if (result.status !== "success") {
    return NextResponse.json(
      { error: "cover_letter_failed", message: "Failed to generate cover letter. Please try again." },
      { status: 422 },
    );
  }

  // Save cover letter
  const existing = await prisma.coverLetter.findFirst({
    where: { applicationId: id },
    select: { id: true },
  });

  const coverLetter = existing
    ? await prisma.coverLetter.update({
        where: { id: existing.id },
        data: { content: result.content },
      })
    : await prisma.coverLetter.create({
        data: { applicationId: id, content: result.content },
      });

  return NextResponse.json({
    id: coverLetter.id,
    content: coverLetter.content,
    createdAt: coverLetter.createdAt.toISOString(),
  });
}
