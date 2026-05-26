import { auth } from "@/auth";
import { PlanTier, UserRole } from "@/constants/enums";
import { canAccessRecruiterPaidFeature } from "@/lib/billing/plan-access";
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
 * isPaidPlan
 * Checks whether a recruiter plan can access paid talent features.
 * Returns true when the plan is allowed by billing access rules.
 */
function isPaidPlan(plan: string | null | undefined): boolean {
  if (plan === PlanTier.PRO) {
    return canAccessRecruiterPaidFeature(PlanTier.PRO);
  }

  if (plan === PlanTier.ENTERPRISE) {
    return canAccessRecruiterPaidFeature(PlanTier.ENTERPRISE);
  }

  return canAccessRecruiterPaidFeature(PlanTier.FREE);
}

/*
 * GET /api/recruiter/talent
 * Searches seeker talent profiles for paid recruiters with filters and pagination.
 * Returns talent rows plus pagination metadata or auth/plan/rate-limit errors.
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

  if (!isPaidPlan(recruiter?.plan)) {
    return new Response("Forbidden", { status: 403 });
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
        };
      }),
      total,
      page,
      limit,
    },
  });
}
