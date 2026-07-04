import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicationStatus, ApplySource, JobStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { createApplicationWizardSchema } from "@/lib/validations/application.schema";
import type { DashboardApplicationSummary } from "@/modules/seeker/dashboard/types/applications-table.types";

/*
 * isPrismaUniqueConstraintError
 * Detects a Prisma unique-constraint violation (P2002) without `any`.
 */
function isPrismaUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/*
 * resolveApplicationCompany
 * FEED applications resolve company via the joined Job (admin-posted uses
 * Job's own company* fields; recruiter-posted uses RecruiterProfile).
 * PASTED_LINK applications have no Job row — use the Application's own
 * external* snapshot captured at add-link time (Phase 7).
 */
function resolveApplicationCompany(app: {
  externalCompanyName: string | null;
  job: {
    isAdminPosted: boolean;
    companyName: string | null;
    companyLogoUrl: string | null;
    recruiter: { recruiterProfile: { companyName: string | null; logo: string | null } | null } | null;
  } | null;
}): { companyName: string; companyLogoUrl: string | null } {
  if (!app.job) {
    return { companyName: app.externalCompanyName ?? "Unknown company", companyLogoUrl: null };
  }
  if (app.job.isAdminPosted) {
    return {
      companyName: app.job.companyName ?? "Unknown company",
      companyLogoUrl: app.job.companyLogoUrl ?? null,
    };
  }
  return {
    companyName: app.job.recruiter?.recruiterProfile?.companyName ?? "Unknown company",
    companyLogoUrl: resolveLogoUrl(app.job.recruiter?.recruiterProfile?.logo ?? null),
  };
}

/*
 * GET /api/seeker/applications
 * Lists everything for the /dashboard applications table and the
 * /dashboard/tracker kanban: every Application (FEED + PASTED_LINK, any
 * lifecycle stage) plus DismissedJob rows (passed jobs, `kind: 'dismissed'`,
 * Skipped-tab-only — see DashboardApplicationSummary doc for the known gap
 * on generation-error detection). Ownership-scoped to the caller.
 * Response: {data: DashboardApplicationSummary[]}, newest first.
 */
export async function GET() {
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

  const seekerId = session.user.id;

  const [applications, dismissed] = await Promise.all([
    prisma.application.findMany({
      where: { seekerId },
      select: {
        id: true,
        jobId: true,
        source: true,
        status: true,
        tailoredResumeKey: true,
        coverLetter: true,
        submittedFormData: true,
        externalJobUrl: true,
        externalTitle: true,
        externalCompanyName: true,
        createdAt: true,
        job: {
          select: {
            title: true,
            isAdminPosted: true,
            companyName: true,
            companyLogoUrl: true,
            externalApplyUrl: true,
            recruiter: { select: { recruiterProfile: { select: { companyName: true, logo: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dismissedJob.findMany({
      where: { userId: seekerId },
      select: {
        id: true,
        createdAt: true,
        job: {
          select: {
            title: true,
            isAdminPosted: true,
            companyName: true,
            companyLogoUrl: true,
            recruiter: { select: { recruiterProfile: { select: { companyName: true, logo: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const applicationRows: DashboardApplicationSummary[] = applications.map((app) => {
    const { companyName, companyLogoUrl } = resolveApplicationCompany(app);
    return {
      id: app.id,
      kind: "application",
      jobId: app.jobId,
      jobTitle: app.job?.title ?? app.externalTitle ?? "Untitled role",
      companyName,
      companyLogoUrl,
      // Prisma's generated AppStatus/ApplySource are nominally distinct from
      // the mirrored src/constants/enums.ts types (same string values) — cast
      // at this API boundary only, matching /api/seeker/credits.
      status: app.status as unknown as ApplicationStatus,
      source: app.source as unknown as ApplySource,
      isFinalized: app.tailoredResumeKey !== null,
      hasCoverLetter: app.coverLetter !== null,
      hasSubmittedForm: app.submittedFormData !== null,
      hasGenerationError: false,
      applyUrl: app.job?.externalApplyUrl ?? app.externalJobUrl ?? null,
      createdAt: app.createdAt.toISOString(),
    };
  });

  const dismissedRows: DashboardApplicationSummary[] = dismissed
    .filter((d): d is typeof d & { job: NonNullable<typeof d.job> } => d.job !== null)
    .map((d) => {
      const { companyName, companyLogoUrl } = resolveApplicationCompany({
        externalCompanyName: null,
        job: { ...d.job, recruiter: d.job.recruiter },
      });
      return {
        id: `dismissed:${d.id}`,
        kind: "dismissed",
        jobId: null,
        jobTitle: d.job.title,
        companyName,
        companyLogoUrl,
        status: null,
        source: null,
        isFinalized: false,
        hasCoverLetter: false,
        hasSubmittedForm: false,
        hasGenerationError: false,
        applyUrl: null,
        createdAt: d.createdAt.toISOString(),
      } satisfies DashboardApplicationSummary;
    });

  const rows = [...applicationRows, ...dismissedRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return NextResponse.json({ data: rows }, { status: 200 });
}

/*
 * POST /api/seeker/applications
 * Starts an apply-wizard run against a feed job: creates the Application row
 * the wizard tailors artifacts onto. Dedups on `@@unique([jobId, seekerId])` —
 * a second call for the same job returns 409 with the existing id so the
 * caller can route into that run instead of starting a duplicate.
 * > DEVIATION: AppStatus has no draft/in-progress member (DATA-MODEL is
 * canon and doesn't define one), so this row is created with the schema
 * default `status: APPLIED` immediately, before the wizard's finalize step
 * (Task 8) actually submits anything. The row's real "was this submitted"
 * signal is `tailoredResumeKey`/`submittedFormData` being non-null, not
 * `status` — Phase 6's tracker must filter on that, not on status alone.
 * Request body: createApplicationWizardSchema. Response: {data:{id}} 201,
 * or {error, id} 409 when a run already exists for this job.
 */
export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => null);
  const parsed = createApplicationWizardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { jobId } = parsed.data;
  const seekerId = session.user.id;

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: JobStatus.OPEN },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found or closed" }, { status: 404 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: seekerId },
    select: { id: true },
  });
  let matchScore = 0;
  if (seekerProfile) {
    const jobMatch = await prisma.jobMatch.findUnique({
      where: { jobId_seekerProfileId: { jobId, seekerProfileId: seekerProfile.id } },
      select: { score: true },
    });
    matchScore = jobMatch?.score ?? 0;
  }

  try {
    const application = await prisma.application.create({
      data: {
        jobId,
        seekerId,
        source: ApplySource.FEED,
        status: ApplicationStatus.APPLIED,
        matchScore,
      },
      select: { id: true },
    });
    return NextResponse.json({ data: { id: application.id } }, { status: 201 });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      const existing = await prisma.application.findUnique({
        where: { jobId_seekerId: { jobId, seekerId } },
        select: { id: true },
      });
      return NextResponse.json(
        { error: "You already have an application for this job", id: existing?.id ?? null },
        { status: 409 },
      );
    }
    throw error;
  }
}
