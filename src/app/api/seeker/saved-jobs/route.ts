import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { JobStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/utils";

/*
 * formatSalaryRange
 * Formats nullable salary bounds for saved job cards.
 * Returns a human-readable salary range or "Not specified".
 */
function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
  if (!min && !max) return "Not specified";
  const minStr = min ? `${symbol}${Math.round(min / 1000)}k` : "";
  const maxStr = max ? `${symbol}${Math.round(max / 1000)}k` : "";
  if (min && max) return `${minStr} - ${maxStr}`;
  return minStr || maxStr;
}

/*
 * formatPostedAt
 * Converts a job publish date into a compact relative label.
 * Returns values such as Today, 1 day ago, weeks ago, or months ago.
 */
function formatPostedAt(date: Date | null): string {
  if (!date) return "Recently";
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/*
 * GET /api/seeker/saved-jobs
 * Lists saved jobs for the authenticated seeker with card summary fields.
 * Returns saved job data or auth/rate-limit errors.
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

  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          recruiter: {
            select: {
              recruiterProfile: {
                select: { id: true, companyName: true, logo: true },
              },
            },
          },
          skills: {
            include: { skill: { select: { name: true } } },
          },
          _count: { select: { applications: true } },
          applications: {
            where: { seekerId: session.user.id },
            select: { id: true, status: true },
            take: 1,
          },
        },
      },
    },
  });

  return NextResponse.json({
    data: savedJobs.map((savedJob) => ({
      id: savedJob.id,
      savedAt: savedJob.createdAt.toISOString(),
      application: savedJob.job.applications[0] ?? null,
      job: {
        id: savedJob.job.id,
        title: savedJob.job.title,
        companyId: savedJob.job.recruiter.recruiterProfile?.id ?? null,
        companyName: savedJob.job.recruiter.recruiterProfile?.companyName ?? "Unknown",
        companyLogoUrl: resolveLogoUrl(savedJob.job.recruiter.recruiterProfile?.logo),
        location: savedJob.job.workType ?? "Remote",
        salaryRange: formatSalaryRange(
          savedJob.job.salaryMin,
          savedJob.job.salaryMax,
          savedJob.job.currency,
        ),
        tags: savedJob.job.skills.slice(0, 3).map((jobSkill) => jobSkill.skill.name),
        postedAt: formatPostedAt(savedJob.job.publishedAt),
        isClosed: savedJob.job.status !== JobStatus.OPEN,
        applyType: savedJob.job.applyType,
        externalApplyUrl: savedJob.job.externalApplyUrl,
        description: savedJob.job.description ? stripHtml(savedJob.job.description) : null,
        applicantCount: savedJob.job._count.applications,
      },
    })),
  });
}
