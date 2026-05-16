import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { searchRateLimiter } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/*
 * GET /api/recruiter/saved
 * Returns the recruiter's saved engineers in the same locked/unlocked shape as the talent pool.
 * Cursor-based pagination with createdAt desc ordering.
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

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor")?.trim() ?? "";
  const limitRaw = url.searchParams.get("limit")?.trim() ?? "";
  const limit = Math.min(
    limitRaw ? Math.max(1, Number.parseInt(limitRaw, 10)) : 12,
    50,
  );

  // Fetch saved engineers via the SavedEngineer join
  const savedRecordsPromise = prisma.savedEngineer.findMany({
    where: { recruiterId: session.user.id },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      engineer: {
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
      },
    },
  });

  const [savedRecords, unlocks] = await Promise.all([
    savedRecordsPromise,
    prisma.engineerUnlock.findMany({
      where: { recruiterId: session.user.id },
      select: { engineerId: true },
    }),
  ]);

  const unlockedSet = new Set(unlocks.map((u) => u.engineerId));

  const items = savedRecords.map((rec) => {
    const eng = rec.engineer;
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
      skills: profile?.skills.map((s: { skill: { name: string } }) => s.skill.name) ?? [],
      salaryMinUsd: profile?.salaryMinUsd ?? 0,
      salaryMaxUsd: profile?.salaryMaxUsd ?? 0,
      timezoneOverlapHours: eng.timezoneOverlapHours ?? 0,
      availableFrom: eng.availableFrom?.toISOString() ?? null,
      isUnlocked,
      isSaved: true,
      savedAt: rec.createdAt?.toISOString(),
    };

    if (!isUnlocked) return base;

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
    savedRecords.length === limit
      ? savedRecords[savedRecords.length - 1]?.id
      : null;

  return NextResponse.json({ data: { items, nextCursor } });
}
