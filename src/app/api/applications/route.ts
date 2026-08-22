import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ApplicationStatus,
  AutomationStatus,
  CurrencyCode,
  JobStatus,
  UserRole,
  VerificationStatus,
} from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { stripHtml } from "@/lib/utils";
import { createApplicationSchema } from "@/lib/validations/application";
import { touchLastActive } from "@/lib/touch-last-active";
import { applyRateLimiter, dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { getMissingSkillNames } from "@/lib/seeker-dashboard";
import {
  GENERATION_TIMEOUT_MS,
  GENERATION_TIMEOUT_REASON,
} from "@/lib/generation/automation-status";

/*
 * formatSalaryRange
 * Formats nullable salary bounds into the compact application card label.
 * Returns a display string using the configured currency symbol.
 */
function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  const cur = currency ?? CurrencyCode.USD;
  const symbol =
    cur === CurrencyCode.USD
      ? "$"
      : cur === CurrencyCode.GBP
        ? "£"
        : cur === CurrencyCode.EUR
          ? "€"
          : "";
  if (!min && !max) return "Not specified";
  const minStr = min ? `${symbol}${Math.round(min / 1000)}k` : "";
  const maxStr = max ? `${symbol}${Math.round(max / 1000)}k` : "";
  if (min && max) return `${minStr} – ${maxStr}`;
  return minStr || maxStr;
}

/*
 * POST /api/applications
 * Creates a job application for an authenticated seeker.
 * Returns the created application or validation/auth/rate-limit errors.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await applyRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success: userSuccess } = await writeRateLimiter.limit(session.user.id);
  if (!userSuccess) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Verification gate — only VERIFIED seekers may submit applications
  const seekerUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true },
  });
  if (seekerUser?.verificationStatus !== VerificationStatus.VERIFIED) {
    return NextResponse.json(
      { error: "Complete verification to apply to jobs" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { jobId, coverLetter } = parsed.data;
  const resumeGateMessage =
    "Upload your resume in Settings before applying. Go to /settings to continue.";

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: JobStatus.OPEN },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found or closed" }, { status: 404 });
  }

  const existingApplication = await prisma.application.findUnique({
    where: {
      jobId_seekerId: {
        jobId,
        seekerId: session.user.id,
      },
    },
    select: { id: true },
  });

  if (existingApplication) {
    return NextResponse.json(
      { error: "You have already applied to this job" },
      { status: 409 },
    );
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, resumeKey: true },
  });
  if (!seekerProfile?.resumeKey) {
    return NextResponse.json({ error: resumeGateMessage }, { status: 400 });
  }

  let matchScore = 0;
  if (seekerProfile) {
    const jobMatch = await prisma.jobMatch.findUnique({
      where: {
        jobId_seekerProfileId: {
          jobId,
          seekerProfileId: seekerProfile.id,
        },
      },
    });
    matchScore = jobMatch?.score ?? 0;
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      seekerId: session.user.id,
      status: ApplicationStatus.APPLIED,
      coverLetter: coverLetter ?? null,
      matchScore,
    },
  });

  return NextResponse.json(application, { status: 201 });
}

/*
 * GET /api/applications
 * Lists the authenticated seeker's applications with job summary data.
 * Server paginated (?page & ?limit & ?q & ?tab) for scale — front-end 10/25/50.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  void touchLastActive(session.user.id);

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const rawPage = Number(url.searchParams.get("page") ?? "1");
  const rawLimit = Number(url.searchParams.get("limit") ?? "10");
  const q = (url.searchParams.get("q") ?? "").trim();
  const tab = url.searchParams.get("tab") ?? "All";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = [10, 25, 50].includes(rawLimit) ? rawLimit : 10;

  // Resolve stale GENERATING runs (dead workers etc.) so the tracker board
  // never shows a spinner forever — same timeout as the per-application route.
  await prisma.application.updateMany({
    where: {
      seekerId: session.user.id,
      automationStatus: AutomationStatus.GENERATING,
      generationStartedAt: { lt: new Date(Date.now() - GENERATION_TIMEOUT_MS) },
    },
    data: {
      automationStatus: AutomationStatus.FAILED,
      failureReason: GENERATION_TIMEOUT_REASON,
    },
  });

  // Server pagination + search/tab for scale (dedicated server 10/25/50)
  const where: any = { seekerId: session.user.id };
  if (tab !== "All" && (Object.values(ApplicationStatus) as string[]).includes(tab)) {
    where.status = tab;
  }
  if (q) {
    where.job = {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { skills: { select: { skillId: true } } },
  });
  const seekerSkillIds = seekerProfile?.skills.map((s) => s.skillId) ?? [];

  const total = await prisma.application.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * limit;

  const applications = await prisma.application.findMany({
    where,
    select: {
      id: true,
      jobId: true,
      status: true,
      automationStatus: true,
      failureReason: true,
      pipelineStage: true,
      createdAt: true,
      job: {
        select: {
          title: true,
          status: true,
          description: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          jobType: true,
          workType: true,
          experienceLevel: true,
          companyName: true,
          companyLogoUrl: true,
          location: true,
          companyIndustry: true,
          companySize: true,
          companyFunding: true,
          skills: {
            select: {
              skillId: true,
              skill: { select: { name: true } },
            },
          },
          _count: { select: { applications: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  const validApplications = applications.filter((a) => a.job);

  const data = validApplications.map((application) => {
    const job = application.job!;
    return {
      id: application.id,
      jobId: application.jobId,
      jobTitle: job.title,
      jobStatus: job.status,
      companyName: job.companyName ?? "Unknown Company",
      companyLogoUrl: resolveLogoUrl(job.companyLogoUrl),
      location: job.location,
      salaryRange: formatSalaryRange(job.salaryMin, job.salaryMax, job.currency),
      jobType: job.jobType,
      workType: job.workType,
      experienceLevel: job.experienceLevel,
      companyIndustry: job.companyIndustry ?? null,
      companySize: job.companySize ?? null,
      companyFundingType: job.companyFunding ?? null,
      automationStatus: application.automationStatus,
      failureReason: application.failureReason,
      pipelineStage: application.pipelineStage,
      skills: job.skills.map((jobSkill) => jobSkill.skill.name),
      matchedSkillNames: job.skills.filter((jobSkill) => seekerSkillIds.includes(jobSkill.skillId)).map((jobSkill) => jobSkill.skill.name),
      missingSkills: getMissingSkillNames(seekerSkillIds, job.skills),
      description: job.description ? stripHtml(job.description) : null,
      applicantCount: job._count.applications,
      status: application.status,
      appliedAt: application.createdAt.toISOString(),
    };
  });

  return NextResponse.json({
    data,
    pagination: { page: safePage, limit, total, totalPages },
  });
}
