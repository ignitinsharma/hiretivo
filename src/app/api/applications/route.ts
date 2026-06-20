import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  ApplicationStatus,
  CurrencyCode,
  JobStatus,
  UserRole,
  VerificationStatus,
} from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { stripHtml } from "@/lib/utils";
import { createApplicationSchema } from "@/lib/validations/application";
import { applyRateLimiter, dataFetchRateLimiter, writeRateLimiter } from "@/lib/rate-limit";
import { getMissingSkillNames } from "@/lib/seeker-dashboard";

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
    "Upload your resume in Settings before applying. Go to /seeker/settings to continue.";

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: JobStatus.OPEN },
    select: { id: true, recruiterId: true },
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
 * Returns normalized application cards or auth/rate-limit errors.
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

  const applications = await prisma.application.findMany({
    where: { seekerId: session.user.id },
    select: {
      id: true,
      jobId: true,
      status: true,
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
          skills: {
            select: {
              skillId: true,
              skill: { select: { name: true } },
            },
          },
          _count: { select: { applications: true } },
          recruiter: {
            select: {
              recruiterProfile: {
                select: {
                  id: true,
                  companyName: true,
                  logo: true,
                  companySize: true,
                  fundingType: true,
                  industry: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Seeker skill IDs for per-application matched/missing skill computation
  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { skills: { select: { skillId: true } } },
  });
  const seekerSkillIds = seekerProfile?.skills.map((s) => s.skillId) ?? [];

  return NextResponse.json(
    applications.map((application) => ({
      id: application.id,
      jobId: application.jobId,
      jobTitle: application.job.title,
      jobStatus: application.job.status,
      companyId: application.job.recruiter.recruiterProfile?.id ?? null,
      companyName:
        application.job.recruiter.recruiterProfile?.companyName ?? "Unknown Company",
      companyLogoUrl: resolveLogoUrl(application.job.recruiter.recruiterProfile?.logo),
      salaryRange: formatSalaryRange(
        application.job.salaryMin,
        application.job.salaryMax,
        application.job.currency,
      ),
      jobType: application.job.jobType,
      workType: application.job.workType,
      experienceLevel: application.job.experienceLevel,
      companyIndustry: application.job.recruiter.recruiterProfile?.industry ?? null,
      companySize: application.job.recruiter.recruiterProfile?.companySize ?? null,
      companyFundingType:
        application.job.recruiter.recruiterProfile?.fundingType ?? null,
      skills: application.job.skills.map((jobSkill) => jobSkill.skill.name),
      matchedSkillNames: application.job.skills
        .filter((jobSkill) => seekerSkillIds.includes(jobSkill.skillId))
        .map((jobSkill) => jobSkill.skill.name),
      missingSkills: getMissingSkillNames(seekerSkillIds, application.job.skills),
      description: application.job.description ? stripHtml(application.job.description) : null,
      applicantCount: application.job._count.applications,
      status: application.status,
      appliedAt: application.createdAt.toISOString(),
    })),
  );
}
