import { auth } from "@/auth";
import { DEMO_THRESHOLD } from "@/constants/demo-engineers";
import { UserRole } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { searchRateLimiter } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

/*
 * parsePositiveInt
 * Parses positive integer query params for pagination.
 * Returns the fallback when the value is missing or invalid.
 */
function parsePositiveInt(rawValue: string | null, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

/*
 * getBioExcerpt
 * Truncates long seeker bios for talent list cards.
 * Returns null for empty bios or a max-length excerpt.
 */
function getBioExcerpt(bio: string | null | undefined): string | null {
  if (!bio) {
    return null;
  }

  return bio.length > 180 ? `${bio.slice(0, 177)}...` : bio;
}


/*
 * GET /api/recruiter/talent
 * Returns talent pool for paid and free recruiters with search/filter/pagination.
 * FREE plan: returns blurred seeker items (name = "First L.", email/image null) + demoCount + isFreePlan:true.
 *   Enables mix-mode in TalentPoolClient without a hard paywall.
 * Paid plans: returns full unblurred talent list + demoCount + isFreePlan:false.
 * demoCount is NOT filtered by search — always reflects total real pool size.
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

  // Count all seekers with a profile — runs for both FREE and paid paths.
  // Not affected by search filters — always reflects real pool size.
  const demoCount = await prisma.user.count({
    where: { role: "SEEKER", verificationStatus: 'VERIFIED', seekerProfile: { isNot: null } },
  });

  if (!canAccessTalentPool(recruiter?.plan)) {
    // FREE plan: return blurred seeker items (up to DEMO_THRESHOLD) + demoCount.
    // Names are blurred to "First L." server-side. Email and image are nulled.
    // Client uses these alongside DEMO_ENGINEERS static cards for mix-mode grid.
    const blurredSeekers = await prisma.user.findMany({
      where: { role: "SEEKER", verificationStatus: 'VERIFIED', seekerProfile: { isNot: null } },
      take: DEMO_THRESHOLD,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        seekerProfile: {
          select: {
            headline: true,
            yearsExperience: true,
            primaryRole: true,
            availability: true,
            resumeKey: true,
            skills: {
              select: { skill: { select: { name: true } } },
              orderBy: { skill: { name: "asc" } },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: {
        items: blurredSeekers.map((seeker) => {
          const profile = seeker.seekerProfile;
          // Blur name: "Priya Sharma" → "Priya S."
          const nameParts = (seeker.name ?? "").trim().split(/\s+/);
          const blurredName =
            nameParts.length >= 2
              ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
              : (nameParts[0] ?? "Engineer");
          return {
            id: seeker.id,
            name: blurredName,
            email: null,      // never expose email on FREE plan
            image: null,      // never expose real avatar on FREE plan
            headline: profile?.headline ?? null,
            bioExcerpt: null, // bio hidden on FREE plan
            location: null,   // location hidden on FREE plan
            yearsExperience: profile?.yearsExperience ?? null,
            primaryRole: profile?.primaryRole ?? null,
            availability: profile?.availability ?? null,
            resumeKey: false, // resume not accessible on FREE plan
            skills: profile?.skills.map((item) => item.skill.name) ?? [],
          };
        }),
        total: demoCount,
        page: 1,
        limit: DEMO_THRESHOLD,
        demoCount,
        isFreePlan: true,
      },
    });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const skill = url.searchParams.get("skill")?.trim() ?? "";
  const location = url.searchParams.get("location")?.trim() ?? "";
  const availability = url.searchParams.get("availability")?.trim() ?? "";
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const limit = Math.min(
    parsePositiveInt(url.searchParams.get("limit"), DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  const where: Prisma.UserWhereInput = {
    role: "SEEKER",
    verificationStatus: 'VERIFIED',
    seekerProfile: {
      is: {
        ...(location
          ? { location: { contains: location, mode: "insensitive" } }
          : {}),
        ...(availability
          ? { availability: { contains: availability, mode: "insensitive" } }
          : {}),
        ...(skill
          ? {
              skills: {
                some: {
                  skill: { name: { contains: skill, mode: "insensitive" } },
                },
              },
            }
          : {}),
      },
    },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            {
              seekerProfile: {
                is: {
                  OR: [
                    { headline: { contains: q, mode: "insensitive" } },
                    { primaryRole: { contains: q, mode: "insensitive" } },
                    { bio: { contains: q, mode: "insensitive" } },
                    { location: { contains: q, mode: "insensitive" } },
                    { availability: { contains: q, mode: "insensitive" } },
                    {
                      workExperiences: {
                        some: {
                          OR: [
                            { company: { contains: q, mode: "insensitive" } },
                            { title: { contains: q, mode: "insensitive" } },
                            { description: { contains: q, mode: "insensitive" } },
                          ],
                        },
                      },
                    },
                    {
                      educations: {
                        some: {
                          OR: [
                            { institution: { contains: q, mode: "insensitive" } },
                            { degree: { contains: q, mode: "insensitive" } },
                            { major: { contains: q, mode: "insensitive" } },
                          ],
                        },
                      },
                    },
                    {
                      skills: {
                        some: {
                          skill: { name: { contains: q, mode: "insensitive" } },
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [seekers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        seekerProfile: {
          select: {
            headline: true,
            bio: true,
            location: true,
            yearsExperience: true,
            primaryRole: true,
            availability: true,
            resumeKey: true,
            skills: {
              select: {
                skill: { select: { name: true } },
              },
              orderBy: { skill: { name: "asc" } },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Batch-load which engineers this recruiter has already unlocked
  const seekerIds = seekers.map((s) => s.id);
  const existingUnlocks = await prisma.engineerUnlock.findMany({
    where: {
      recruiterId: session.user.id,
      engineerId: { in: seekerIds },
    },
    select: { engineerId: true },
  });
  const unlockedSet = new Set(existingUnlocks.map((u) => u.engineerId));

  return NextResponse.json({
    data: {
      items: seekers.map((seeker) => {
        const profile = seeker.seekerProfile;

        return {
          id: seeker.id,
          name: seeker.name,
          email: seeker.email,
          image: resolveLogoUrl(seeker.image),
          headline: profile?.headline ?? null,
          bioExcerpt: getBioExcerpt(profile?.bio),
          location: profile?.location ?? null,
          yearsExperience: profile?.yearsExperience ?? null,
          primaryRole: profile?.primaryRole ?? null,
          availability: profile?.availability ?? null,
          resumeKey: Boolean(profile?.resumeKey),
          skills: profile?.skills.map((item) => item.skill.name) ?? [],
          isUnlocked: unlockedSet.has(seeker.id),
        };
      }),
      total,
      page,
      limit,
      demoCount,
      isFreePlan: false,
    },
  });
}
