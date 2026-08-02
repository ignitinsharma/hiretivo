import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { JobStatus, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { stripHtml } from "@/lib/utils";
import { resolveJobCompany, resolveCompanyLogoUrl } from "@/lib/jobs/resolve-job-company";

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

function formatPostedAt(date: Date | null): string {
  if (!date) return "Recently";
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export async function GET(req: NextRequest) {
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

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10")));
  const skip = (page - 1) * limit;

  const where = { userId: session.user.id, job: { status: { not: JobStatus.DELETED } } };

  const baseInclude = {
    skills: {
      include: { skill: { select: { name: true } } },
    },
    _count: { select: { applications: true } },
  } as const;

  const includeFirstPage = {
    job: {
      include: {
        ...baseInclude,
        applications: {
          where: { seekerId: session.user.id },
          select: { id: true, status: true },
          take: 1,
        },
      },
    },
  };

  const includeLaterPages = {
    job: {
      include: baseInclude,
    },
  };

  const [savedJobs, totalCount] = await Promise.all([
    prisma.savedJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: page === 1 ? includeFirstPage : includeLaterPages,
    }),
    prisma.savedJob.count({ where }),
  ]);

  return NextResponse.json({
    data: savedJobs.map((savedJob) => {
      const company = resolveJobCompany({
        companyName: savedJob.job.companyName,
        companyLogoUrl: savedJob.job.companyLogoUrl,
        companySize: savedJob.job.companySize,
        companyIndustry: savedJob.job.companyIndustry,
        companyFunding: savedJob.job.companyFunding,
      });
      return {
        id: savedJob.id,
        savedAt: savedJob.createdAt.toISOString(),
        application: "applications" in savedJob.job
          ? (savedJob.job as any).applications?.[0] ?? null
          : null,
        job: {
          id: savedJob.job.id,
          title: savedJob.job.title,
          companyId: company.companyId,
          companyName: company.companyName,
          companyLogoUrl: resolveCompanyLogoUrl(company.companyLogoUrl, savedJob.job.companyWebsite),
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
          companyIndustry: company.companyIndustry,
          companySize: company.companySize,
          companyFundingType: company.companyFundingType,
        },
      };
    }),
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  });
}
