import { auth } from "@/auth";
import { JobStatus, PlanTier, UserRole, SeekingStatus, SEEKING_STATUS_VALUES } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import {
  computeBestJobMatchForEngineer,
  type EngineerMatchProfile,
  type JobMatchProfile,
} from "@/lib/match";
import { prisma } from "@/lib/prisma";
import { searchRateLimiter } from "@/lib/rate-limit";
import { resolveLogoUrl } from "@/lib/r2";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/*
 * GET /api/recruiter/talent
 * Returns paginated talent pool list of VERIFIED engineers with locked/unlocked card shape.
 * Locked cards show firstName/lastInitial + metadata. Unlocked cards add fullName/email/github/linkedin/resumeUrl.
 * FREE plan returns 403 with UPGRADE_REQUIRED. Filters apply to all plans.
 * Cursor-based pagination with hiretivoScore desc ordering (or in-memory best_match sort).
 * Supports sortBy param: best_match, hiretivo_score, recent, salary_asc, timezone.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return new Response("Forbidden", { status: 403 });
  }

  const { success } = await searchRateLimiter.limit(session.user.id);
  if (!success) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!canAccessTalentPool(recruiter?.plan)) {
    return NextResponse.json({ code: "UPGRADE_REQUIRED" }, { status: 403 });
  }

  const url = new URL(req.url);

  // Parse query params
  const skillsRaw = url.searchParams.get("skills")?.trim() ?? "";
  const role = url.searchParams.get("role")?.trim() ?? "";
  const salaryMaxRaw = url.searchParams.get("salaryMax")?.trim() ?? "";
  const timezoneOverlapMinRaw = url.searchParams.get("timezoneOverlapMin")?.trim() ?? "";
  const availableBefore = url.searchParams.get("availableBefore")?.trim() ?? "";
  const cursor = url.searchParams.get("cursor")?.trim() ?? "";
  const limitRaw = url.searchParams.get("limit")?.trim() ?? "";
  const sortByRaw = url.searchParams.get("sortBy")?.trim() ?? "";
  const seekingStatusRaw = url.searchParams.get("seekingStatus")?.trim() ?? "";
  const seekingStatus = (SEEKING_STATUS_VALUES as readonly string[]).includes(seekingStatusRaw)
    ? (seekingStatusRaw as SeekingStatus)
    : null;

  const skillsArr = skillsRaw
    ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const salaryMax = salaryMaxRaw ? Number.parseInt(salaryMaxRaw, 10) : undefined;
  const timezoneOverlapMin = timezoneOverlapMinRaw
    ? Number.parseInt(timezoneOverlapMinRaw, 10)
    : undefined;
  const limit = Math.min(
    limitRaw ? Math.max(1, Number.parseInt(limitRaw, 10)) : 12,
    50,
  );

  // Sort whitelist: unknown values fall back to best_match (when jobs exist) or hiretivo_score
  const VALID_SORTS = ["best_match", "hiretivo_score", "recent", "salary_asc", "timezone"] as const;
  const sortBy: (typeof VALID_SORTS)[number] | null = VALID_SORTS.includes(sortByRaw as typeof VALID_SORTS[number]) ? (sortByRaw as typeof VALID_SORTS[number]) : null;

  // Fetch recruiter's open jobs for match scoring
  const recruiterJobs = await prisma.job.findMany({
    where: { recruiterId: session.user.id, status: JobStatus.OPEN },
    select: {
      id: true,
      title: true,
      salaryMin: true,
      salaryMax: true,
      minYearsExperience: true,
      timezoneOverlapHours: true,
      skills: { select: { skill: { select: { name: true } } } },
    },
  });

  const jobProfiles: JobMatchProfile[] = recruiterJobs.map((j) => ({
    id: j.id,
    title: j.title,
    requiredSkills: j.skills.map((s) => s.skill.name),
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    yearsExpRequired: j.minYearsExperience ?? null,
    timezoneOverlapHours: j.timezoneOverlapHours ?? null,
  }));

  const hasOpenJobs = jobProfiles.length > 0;

  // Default sort: best_match when recruiter has open jobs, otherwise hiretivo_score
  const effectiveSortBy = sortBy ?? (hasOpenJobs ? "best_match" : "hiretivo_score");

  // Build where clause
  const where: Prisma.UserWhereInput = {
    role: "SEEKER",
    verificationStatus: "VERIFIED",
    seekerProfile: {
      is: {
        ...(role ? { primaryRole: { contains: role, mode: "insensitive" } } : {}),
        ...(salaryMax !== undefined ? { salaryMinUsd: { lte: salaryMax } } : {}),
        ...(skillsArr.length > 0
          ? {
              skills: {
                some: { skill: { name: { in: skillsArr } } },
              },
            }
          : {}),
      },
    },
    ...(timezoneOverlapMin !== undefined
      ? { timezoneOverlapHours: { gte: timezoneOverlapMin } }
      : {}),
    ...(availableBefore
      ? { availableFrom: { lte: new Date(availableBefore) } }
      : {}),
    ...(seekingStatus !== null ? { seekingStatus } : {}),
    AND: [
      {
        OR: [
          { hiddenUntil: null },
          { hiddenUntil: { lt: new Date() } },
        ],
      },
    ],
  };

  // Determine Prisma orderBy (best_match sorts in-memory after computing scores)
  const prismaOrderBy: Prisma.UserOrderByWithRelationInput[] =
    effectiveSortBy === "recent"
      ? [{ createdAt: "desc" }, { id: "asc" }]
      : effectiveSortBy === "salary_asc"
        ? [{ seekerProfile: { salaryMinUsd: "asc" } }, { id: "asc" }]
        : effectiveSortBy === "timezone"
          ? [{ timezoneOverlapHours: "desc" }, { id: "asc" }]
          : [{ hiretivoScore: "desc" }, { id: "asc" }];

  // Cursor pagination
  const engineersPromise = prisma.user.findMany({
    where,
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: prismaOrderBy,
    select: {
      id: true,
      name: true,
      email: true,
      hiretivoScore: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekingStatus: true,
      seekerProfile: {
        select: {
          primaryRole: true,
          yearsExperience: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          githubUrl: true,
          linkedinUrl: true,
          resumeKey: true,
          skills: {
            select: {
              skill: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const [engineers, unlocks, saved] = await Promise.all([
    engineersPromise,
    prisma.engineerUnlock.findMany({
      where: { recruiterId: session.user.id },
      select: { engineerId: true },
    }),
    prisma.savedEngineer.findMany({
      where: { recruiterId: session.user.id },
      select: { engineerId: true },
    }),
  ]);

  const unlockedSet = new Set(unlocks.map((u) => u.engineerId));
  const savedSet = new Set(saved.map((s) => s.engineerId));

  /*
   * Build items with bestMatch per engineer card.
   * When recruiter has open jobs, compute weighted match score against each job
   * and return the highest-scoring match for display.
   */
  let items = engineers.map((eng) => {
    const profile = eng.seekerProfile;
    const isUnlocked = unlockedSet.has(eng.id);
    const nameParts = (eng.name ?? "").split(" ");
    const firstName = nameParts[0] ?? "";
    const lastInitial =
      nameParts.length > 1 ? (nameParts[nameParts.length - 1]?.[0] ?? "") : "";

    // Compute best match score for this engineer against recruiter's open jobs
    const engineerProfile: EngineerMatchProfile = {
      skills: profile?.skills.map((s) => s.skill.name) ?? [],
      salaryMin: profile?.salaryMinUsd ?? null,
      salaryMax: profile?.salaryMaxUsd ?? null,
      yearsExperience: profile?.yearsExperience ?? null,
      timezoneOverlapHours: eng.timezoneOverlapHours ?? null,
      availableFrom: eng.availableFrom ?? null,
    };
    const bestMatch = hasOpenJobs
      ? computeBestJobMatchForEngineer(engineerProfile, jobProfiles)
      : null;

    const base = {
      id: eng.id,
      firstName,
      lastInitial,
      hiretivoScore: eng.hiretivoScore ?? 0,
      role: profile?.primaryRole ?? "",
      yearsExperience: profile?.yearsExperience ?? 0,
      skills: profile?.skills.map((s) => s.skill.name) ?? [],
      salaryMinUsd: profile?.salaryMinUsd ?? 0,
      salaryMaxUsd: profile?.salaryMaxUsd ?? 0,
      timezoneOverlapHours: eng.timezoneOverlapHours ?? 0,
      availableFrom: eng.availableFrom?.toISOString() ?? null,
      bestMatch,
      hasJobsToMatch: hasOpenJobs,
      isUnlocked,
      isSaved: savedSet.has(eng.id),
      seekingStatus: eng.seekingStatus,
    };

    if (!isUnlocked) return base;

    // Unlocked: append PII
    return {
      ...base,
      fullName: eng.name ?? "",
      email: eng.email ?? "",
      githubUrl: profile?.githubUrl ?? null,
      linkedinUrl: profile?.linkedinUrl ?? null,
      resumeUrl: profile?.resumeKey ? resolveLogoUrl(profile.resumeKey) : null,
    };
  });

  // In-memory sort for best_match after computing scores
  if (effectiveSortBy === "best_match" && hasOpenJobs) {
    items.sort((a, b) => {
      const scoreA = a.bestMatch?.score ?? 0;
      const scoreB = b.bestMatch?.score ?? 0;
      return scoreB - scoreA;
    });
  }

  const nextCursor =
    engineers.length === limit ? engineers[engineers.length - 1]?.id : null;

  return NextResponse.json({ data: { items, nextCursor } });
}
