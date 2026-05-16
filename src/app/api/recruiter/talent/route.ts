import { auth } from "@/auth";
import { PlanTier, UserRole } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { searchRateLimiter } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

/*
 * GET /api/recruiter/talent
 * Returns paginated talent pool list of VERIFIED+public engineers with locked/unlocked card shape.
 * Locked cards show firstName/lastInitial + metadata. Unlocked cards add fullName/email/github/linkedin/resumeUrl.
 * FREE plan returns 403 with UPGRADE_REQUIRED. Filters apply to all plans.
 * Cursor-based pagination with hiretivoScore desc ordering.
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

  // Build where clause
  const where: Prisma.UserWhereInput = {
    role: "SEEKER",
    verificationStatus: "VERIFIED",
    seekerProfile: {
      is: {
        profilePublic: true,
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
    AND: [
      {
        OR: [
          { hiddenUntil: null },
          { hiddenUntil: { lt: new Date() } },
        ],
      },
    ],
  };

  // Cursor pagination
  const engineersPromise = prisma.user.findMany({
    where,
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ hiretivoScore: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      hiretivoScore: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          primaryRole: true,
          yearsExperience: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          profilePublic: true,
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

  const items = engineers.map((eng) => {
    const profile = eng.seekerProfile;
    const isUnlocked = unlockedSet.has(eng.id);
    const nameParts = (eng.name ?? "").split(" ");
    const firstName = nameParts[0] ?? "";
    const lastInitial =
      nameParts.length > 1 ? (nameParts[nameParts.length - 1]?.[0] ?? "") : "";

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
      isUnlocked,
      isSaved: savedSet.has(eng.id),
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

  const nextCursor =
    engineers.length === limit ? engineers[engineers.length - 1]?.id : null;

  return NextResponse.json({ data: { items, nextCursor } });
}
