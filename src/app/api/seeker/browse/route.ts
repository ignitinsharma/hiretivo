import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { JobType as PrismaJobType, WorkType as PrismaWorkType } from "@prisma/client";
import { auth } from "@/auth";
import { CurrencyCode, JobStatus, UserRole, MatchThreshold, LocationClass } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { feedFilterSchema } from "@/lib/validations/match";
import { createRateLimiter } from "@/lib/rate-limit";
import { touchLastActive } from "@/lib/touch-last-active";
import { getMissingSkillNames } from "@/lib/seeker-dashboard";
import { resolveJobCompany, resolveCompanyLogoUrl } from "@/lib/jobs/resolve-job-company";
import { stripHtml } from "@/lib/utils";

const LOCATION_BADGE: Record<LocationClass, string> = {
  [LocationClass.WORLDWIDE]: "🌍 Remote (Worldwide)",
  [LocationClass.US_ONLY]: "🇺🇸 Remote (US Only)",
  [LocationClass.EMEA]: "🇪🇺 Remote (EMEA)",
  [LocationClass.INDIA]: "🇮🇳 India",
  [LocationClass.ONSITE]: "🏢 On-site",
};

interface JobFeedItem {
  id: string;
  title: string;
  companyId: string | null;
  companyName: string;
  companyLogoUrl: string | null;
  location: string;
  salaryRange: string;
  matchScore: number;
  tags: string[];
  postedAt: string;
  jobType: string;
  workType: string | null;
  experienceLevel: string | null;
  companyIndustry: string | null;
  companySize: string | null;
  companyFundingType: string | null;
  matchedSkillNames: string[];
  applyType: string;
  externalApplyUrl: string | null;
  missingSkills: string[];
  missingSkillsHint: string | null;
  description: string | null;
  applicantCount: number;
  locationClass: string | null;
  visaSponsored: boolean;
}

const browseRateLimiter = createRateLimiter("seeker-browse", 30, "1 m");

const LOW_MATCH_THRESHOLD = MatchThreshold.GOOD;
const MAX_HINT_SKILLS = 3;

function formatSalaryRange(min: number | null, max: number | null, currency: string | null): string {
  const cur = currency ?? CurrencyCode.USD;
  const symbol = cur === CurrencyCode.USD ? "$" : cur === CurrencyCode.GBP ? "£" : cur === CurrencyCode.EUR ? "€" : "";
  if (!min && !max) return "Not specified";
  const minStr = min ? `${symbol}${Math.round(min / 1000)}k` : "";
  const maxStr = max ? `${symbol}${Math.round(max / 1000)}k` : "";
  if (min && max) return `${minStr} – ${maxStr}`;
  return minStr || maxStr;
}

function formatPostedAt(date: Date | null): string {
  if (!date) return "Recently";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/*
 * GET /api/seeker/browse
 * All-jobs feed for Browse page — every OPEN job ordered by publishedAt desc,
 * searchable/filterable, not gated by match score. Homepage (/dashboard) keeps
 * the matched feed; Browse uses this endpoint so it shows all kinds.
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

  const { success } = await browseRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, skills: { select: { skillId: true } } },
  });

  const seekerSkillIds = seekerProfile?.skills.map((s) => s.skillId) ?? [];

  // Lightweight seekerId check for applied/dismissed exclusion (keeps Browse clean)
  const [appliedRows, dismissedRows] = await Promise.all([
    prisma.application.findMany({ where: { seekerId: session.user.id }, select: { jobId: true } }),
    prisma.dismissedJob.findMany({ where: { userId: session.user.id }, select: { jobId: true } }),
  ]);
  const appliedJobIds = new Set(appliedRows.map((r) => r.jobId).filter((id): id is string => id !== null));
  const dismissedJobIds = new Set(dismissedRows.map((r) => r.jobId).filter((id): id is string => id !== null));

  const parsed = feedFilterSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query params" }, { status: 400 });
  }

  const { cursor, limit, jobType, workType, locationClass, visaSponsored, experienceLevel, q } = parsed.data;

  const feedFilterWhere: Prisma.JobWhereInput = {
    status: JobStatus.OPEN,
    id: { notIn: [...appliedJobIds, ...dismissedJobIds] },
  };
  if (jobType) feedFilterWhere.jobType = jobType as PrismaJobType;
  if (workType) feedFilterWhere.workType = workType as PrismaWorkType;
  if (locationClass) feedFilterWhere.locationClass = locationClass;
  if (visaSponsored) feedFilterWhere.visaSponsored = true;
  if (experienceLevel) feedFilterWhere.experienceLevel = experienceLevel;
  if (q) {
    const qLower = q.toLowerCase();
    feedFilterWhere.OR = [
      { title: { contains: qLower, mode: "insensitive" } },
      { companyName: { contains: qLower, mode: "insensitive" } },
    ];
  }

  // Cursor is base64 { publishedAt, id } from previous page's last item.
  let cursorWhere: Prisma.JobWhereInput = {};
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, "base64").toString()) as { publishedAt: string; id: string };
      const cursorDate = new Date(decoded.publishedAt);
      if (!isNaN(cursorDate.getTime()) && decoded.id) {
        cursorWhere = {
          OR: [
            { publishedAt: { lt: cursorDate } },
            { publishedAt: cursorDate, id: { lt: decoded.id } },
          ],
        };
      }
    } catch {
      // invalid cursor — ignore
    }
  }

  const where: Prisma.JobWhereInput = cursorWhere.OR
    ? { AND: [feedFilterWhere, cursorWhere] }
    : feedFilterWhere;

  // Count for Browse header (optional — cheap enough for <10k OPEN rows)
  const totalCount = await prisma.job.count({ where: feedFilterWhere });

  const jobs = await prisma.job.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: {
      skills: { select: { skillId: true, skill: { select: { name: true } } } },
      _count: { select: { applications: true } },
    },
  });

  const hasNext = jobs.length > limit;
  const pageJobs = hasNext ? jobs.slice(0, limit) : jobs;

  const nextCursor = hasNext
    ? Buffer.from(
        JSON.stringify({
          publishedAt: pageJobs[pageJobs.length - 1].publishedAt?.toISOString() ?? new Date().toISOString(),
          id: pageJobs[pageJobs.length - 1].id,
        }),
      ).toString("base64")
    : null;

  // Score per job for the match pill (computed ad-hoc, not filtered — Browse shows all)
  // Use JobMatch table if present, else 0. For unmatched jobs score stays 0 and hint shows missing skills.
  let scoreMap = new Map<string, number>();
  if (seekerProfile) {
    const jobIds = pageJobs.map((j) => j.id);
    const matches = await prisma.jobMatch.findMany({
      where: { seekerProfileId: seekerProfile.id, jobId: { in: jobIds } },
      select: { jobId: true, score: true },
    });
    scoreMap = new Map(matches.map((m) => [m.jobId, m.score]));
  }

  const jobsResponse: JobFeedItem[] = pageJobs.map((job) => {
    const score = scoreMap.get(job.id) ?? 0;
    return buildJobResponse(job, seekerSkillIds, score);
  });

  return NextResponse.json({
    jobs: jobsResponse,
    nextCursor,
    totalCount,
    hasMoreRecent: false,
  });
}

function buildJobResponse(job: any, seekerSkillIds: string[], score: number): JobFeedItem {
  const jobSkillsForHint = job.skills ?? [];
  const matchedSkillNames = jobSkillsForHint.filter((js: any) => seekerSkillIds.includes(js.skillId)).map((js: any) => js.skill.name);
  const missingSkills = getMissingSkillNames(seekerSkillIds, jobSkillsForHint);
  let missingSkillsHint: string | null = null;
  if (score < LOW_MATCH_THRESHOLD && missingSkills.length > 0) {
    missingSkillsHint = `Missing: ${missingSkills.slice(0, MAX_HINT_SKILLS).join(", ")}`;
  }

  const company = resolveJobCompany({
    companyName: job.companyName,
    companyLogoUrl: job.companyLogoUrl,
    companySize: job.companySize,
    companyIndustry: job.companyIndustry,
    companyFunding: job.companyFunding,
  });
  const locationBadge = (LOCATION_BADGE[job.locationClass as LocationClass] || job.workType) ?? "Remote";

  return {
    id: job.id,
    title: job.title,
    companyId: company.companyId,
    companyName: company.companyName,
    companyLogoUrl: resolveCompanyLogoUrl(company.companyLogoUrl, job.companyWebsite),
    location: locationBadge,
    salaryRange: formatSalaryRange(job.salaryMin, job.salaryMax, job.currency),
    matchScore: score,
    tags: jobSkillsForHint.slice(0, 3).map((js: any) => js.skill.name),
    postedAt: formatPostedAt(job.publishedAt),
    jobType: job.jobType,
    workType: job.workType,
    experienceLevel: job.experienceLevel,
    companyIndustry: company.companyIndustry,
    companySize: company.companySize,
    companyFundingType: company.companyFundingType,
    matchedSkillNames,
    applyType: job.applyType,
    externalApplyUrl: job.externalApplyUrl,
    missingSkills,
    missingSkillsHint,
    description: job.description ? stripHtml(job.description) : null,
    applicantCount: job._count?.applications ?? 0,
    locationClass: job.locationClass ?? null,
    visaSponsored: job.visaSponsored ?? false,
  };
}
