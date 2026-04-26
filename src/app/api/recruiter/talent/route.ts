import { auth } from "@/auth";
import { PlanTier, UserRole } from "@/constants/enums";
import { canAccessRecruiterPaidFeature } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

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

function getBioExcerpt(bio: string | null | undefined): string | null {
  if (!bio) {
    return null;
  }

  return bio.length > 180 ? `${bio.slice(0, 177)}...` : bio;
}

function isPaidPlan(plan: string | null | undefined): boolean {
  if (plan === PlanTier.PRO) {
    return canAccessRecruiterPaidFeature(PlanTier.PRO);
  }

  if (plan === PlanTier.ENTERPRISE) {
    return canAccessRecruiterPaidFeature(PlanTier.ENTERPRISE);
  }

  return canAccessRecruiterPaidFeature(PlanTier.FREE);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return new Response("Forbidden", { status: 403 });
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

  const [seekers, total, shortlists] = await Promise.all([
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
    prisma.talentShortlist.findMany({
      where: { recruiterId: session.user.id },
      select: { seekerId: true },
    }),
  ]);

  const shortlistedIds = new Set(shortlists.map((item) => item.seekerId));

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
          isShortlisted: shortlistedIds.has(seeker.id),
        };
      }),
      total,
      page,
      limit,
    },
  });
}
