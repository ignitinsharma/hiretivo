import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";
import { renderResumePdf } from "@/lib/resume/render";
import { storeResumePdf } from "@/lib/resume/store";
import { getSignedFileUrl } from "@/lib/r2";
import { finalizeApplicationSchema } from "@/lib/validations/application.schema";

/*
 * POST /api/seeker/applications/[id]/finalize
 * The wizard's "I submitted my application" confirm: renders the edited
 * resume to an ATS-safe PDF, uploads it, and records the submission
 * (tailoredResumeKey, coverLetter, submittedFormData, status, statusLog).
 * No credit is reserved or consumed here — Phase 4 already reserves the
 * wizard-run's one credit at successful resume/cover generation (refunded
 * only if generation fails outright); finalize just persists what that
 * credit already paid for. Request body: finalizeApplicationSchema.
 * Response: {data:{tailoredResumeUrl}}.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    select: { seekerId: true, statusLog: true },
  });
  if (!application || application.seekerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!seekerProfile) {
    return NextResponse.json({ error: "Complete your profile before applying" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = finalizeApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const pdf = await renderResumePdf(parsed.data.resume);
  const { key } = await storeResumePdf(seekerProfile.id, pdf);
  const tailoredResumeUrl = await getSignedFileUrl(key);

  const existingLog = Array.isArray(application.statusLog) ? application.statusLog : [];
  const statusLog = [...existingLog, { status: ApplicationStatus.APPLIED, at: new Date().toISOString() }];

  await prisma.application.update({
    where: { id },
    data: {
      tailoredResumeKey: key,
      coverLetter: parsed.data.coverLetter,
      submittedFormData: parsed.data.submittedFormData,
      status: ApplicationStatus.APPLIED,
      statusLog,
    },
  });

  return NextResponse.json({ data: { tailoredResumeUrl } }, { status: 200 });
}
