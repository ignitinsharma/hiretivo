import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl } from "@/lib/r2";
import { dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/utils";
import { patchApplicationSchema } from "@/lib/validations/application.schema";
import type { ApplicationDetail } from "@/modules/seeker/apply/types/apply.types";

/*
 * GET /api/seeker/applications/[id]
 * Fetches one Application for the apply wizard — job/JD context plus any
 * artifacts already saved on a resumed or completed run. Ownership-scoped:
 * returns 404 (not 403) for another seeker's application. JD context comes
 * from the joined Job for FEED applications, or from the Application's own
 * external* fields for a jobless PASTED_LINK row (Phase 7).
 * Response: {data: ApplicationDetail}.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const application = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      jobId: true,
      seekerId: true,
      source: true,
      status: true,
      matchScore: true,
      externalJobUrl: true,
      externalTitle: true,
      externalCompanyName: true,
      externalDescription: true,
      externalSkills: true,
      tailoredResumeKey: true,
      coverLetter: true,
      submittedFormData: true,
      keywordStats: true,
      createdAt: true,
      job: {
        select: {
          title: true,
          description: true,
          isAdminPosted: true,
          companyName: true,
          externalApplyUrl: true,
          recruiter: { select: { recruiterProfile: { select: { companyName: true } } } },
          skills: { select: { skill: { select: { name: true } } } },
        },
      },
    },
  });

  if (!application || application.seekerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // PASTED_LINK rows have no Job — their JD context lives on external* fields instead.
  if (!application.job && !application.externalJobUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const tailoredResumeUrl = application.tailoredResumeKey
    ? await getSignedFileUrl(application.tailoredResumeKey).catch(() => null)
    : null;

  const jobContext = application.job
    ? {
        jobTitle: application.job.title,
        companyName: application.job.isAdminPosted
          ? (application.job.companyName ?? "Unknown Company")
          : (application.job.recruiter.recruiterProfile?.companyName ?? "Unknown Company"),
        jdText: stripHtml(application.job.description),
        requiredSkills: application.job.skills.map((s) => s.skill.name),
        applyUrl: application.externalJobUrl ?? application.job.externalApplyUrl,
      }
    : {
        jobTitle: application.externalTitle ?? "Untitled role",
        companyName: application.externalCompanyName ?? "Unknown Company",
        jdText: application.externalDescription ?? "",
        requiredSkills: (application.externalSkills as string[] | null) ?? [],
        applyUrl: application.externalJobUrl,
      };

  const detail: ApplicationDetail = {
    id: application.id,
    jobId: application.jobId,
    // Prisma's generated enums and this app's src/constants/enums.ts mirrors
    // share string values but are distinct nominal types (same convention as
    // the apply-ai routes' `plan as unknown as PlanTier` boundary cast).
    source: application.source as unknown as ApplicationDetail["source"],
    status: application.status as unknown as ApplicationDetail["status"],
    matchScore: application.matchScore,
    ...jobContext,
    preferredSkills: [],
    externalJobUrl: application.externalJobUrl,
    tailoredResumeKey: application.tailoredResumeKey,
    tailoredResumeUrl,
    coverLetter: application.coverLetter,
    submittedFormData: application.submittedFormData as ApplicationDetail["submittedFormData"],
    keywordStats: application.keywordStats as ApplicationDetail["keywordStats"],
    createdAt: application.createdAt.toISOString(),
  };

  return NextResponse.json({ data: detail }, { status: 200 });
}

/*
 * PATCH /api/seeker/applications/[id]
 * Whitelisted partial artifact save as the wizard advances (draft resume
 * key, cover letter text, submitted-form snapshot, keyword stats), PLUS the
 * tracker's (Section F2) drag-and-drop status transitions. When `status` is
 * present and differs from the row's current value, appends a
 * {from, to, timestamp} entry to the Json `statusLog` array — a same-value
 * write (drag to the same column) is a no-op on the log.
 * Request body: patchApplicationSchema. Response: {data:{id}}.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const existing = await prisma.application.findUnique({
    where: { id },
    select: { seekerId: true, status: true, statusLog: true },
  });
  if (!existing || existing.seekerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { status: nextStatus, ...rest } = parsed.data;
  const data: Prisma.ApplicationUpdateInput = { ...rest };
  if (nextStatus) {
    // Prisma's generated AppStatus is nominally distinct from the mirrored
    // src/constants/enums.ts ApplicationStatus (same string values) — cast
    // at this API boundary only, matching the GET route above.
    data.status = nextStatus as unknown as Prisma.ApplicationUpdateInput["status"];
    if (nextStatus !== existing.status) {
      const priorLog = Array.isArray(existing.statusLog) ? existing.statusLog : [];
      data.statusLog = [
        ...priorLog,
        { from: existing.status, to: nextStatus, timestamp: new Date().toISOString() },
      ] as Prisma.InputJsonValue;
    }
  }

  await prisma.application.update({
    where: { id },
    data,
  });

  return NextResponse.json({ data: { id } }, { status: 200 });
}
