import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
 * Two independent steps, callable in one request or two:
 *  1. Render step (requires `resume`, only runs once — skipped if
 *     tailoredResumeKey is already set): renders the resume to an ATS-safe
 *     PDF, uploads it, saves tailoredResumeKey (+ coverLetter if supplied).
 *  2. Submit step (requires `submittedFormData`): records the seeker's
 *     confirmed submission and appends to statusLog.
 * The wizard's "I submitted my application" button sends both in one call
 * (unchanged behavior). Section D5's Apply-to-all sends only the render step
 * (lands the row in Needs-you); Approve-all later sends only the submit step
 * against an already-rendered row (no re-render, no second PDF).
 * No credit is reserved or consumed here — Phase 4 already reserves the
 * wizard-run's one credit at successful resume/cover generation (refunded
 * only if generation fails outright); finalize just persists what that
 * credit already paid for. Request body: finalizeApplicationSchema.
 * Response: {data:{tailoredResumeUrl}} — the existing or newly-rendered key's
 * signed URL, null if neither step applies (submit-only call on a row with
 * no tailoredResumeKey yet, which the route rejects with 400 instead).
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
    select: { seekerId: true, statusLog: true, tailoredResumeKey: true },
  });
  if (!application || application.seekerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = finalizeApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const needsRender = !application.tailoredResumeKey;
  if (needsRender && !parsed.data.resume) {
    return NextResponse.json({ error: "Resume is required to finalize this application" }, { status: 400 });
  }
  if (!needsRender && !parsed.data.submittedFormData) {
    return NextResponse.json({ error: "Nothing to finalize — already rendered" }, { status: 400 });
  }

  const data: Prisma.ApplicationUpdateInput = {};
  let tailoredResumeUrl: string | null = null;

  if (needsRender && parsed.data.resume) {
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!seekerProfile) {
      return NextResponse.json({ error: "Complete your profile before applying" }, { status: 400 });
    }
    const pdf = await renderResumePdf(parsed.data.resume);
    const { key } = await storeResumePdf(seekerProfile.id, pdf);
    data.tailoredResumeKey = key;
    tailoredResumeUrl = await getSignedFileUrl(key);
  } else {
    tailoredResumeUrl = await getSignedFileUrl(application.tailoredResumeKey as string);
  }

  if (parsed.data.coverLetter !== undefined) {
    data.coverLetter = parsed.data.coverLetter;
  }

  if (parsed.data.submittedFormData) {
    const existingLog = Array.isArray(application.statusLog) ? application.statusLog : [];
    data.submittedFormData = parsed.data.submittedFormData;
    data.status = ApplicationStatus.APPLIED;
    data.statusLog = [...existingLog, { status: ApplicationStatus.APPLIED, at: new Date().toISOString() }];
  }

  await prisma.application.update({ where: { id }, data });

  return NextResponse.json({ data: { tailoredResumeUrl } }, { status: 200 });
}
