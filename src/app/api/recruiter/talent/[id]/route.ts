import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { dataFetchRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/*
 * GET /api/recruiter/talent/[id]
 * Returns full TalentDetail shape for the profile dialog.
 * Locked: sensitive fields (email, links, resumeUrl) are nulled out.
 * Unlocked: full profile with contact info and links.
 * Returns 404 if engineer not VERIFIED+profilePublic or hiddenUntil active.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.RECRUITER)
    return new Response("Forbidden", { status: 403 });

  const ip = getRateLimitIp(req);
  const { success } = await dataFetchRateLimiter.limit(ip);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!canAccessTalentPool(recruiter?.plan)) {
    return NextResponse.json({ code: "UPGRADE_REQUIRED" }, { status: 403 });
  }

  const engineer = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: "SEEKER",
      verificationStatus: "VERIFIED",
      seekerProfile: { is: { profilePublic: true } },
      AND: [
        { OR: [{ hiddenUntil: null }, { hiddenUntil: { lt: new Date() } }] },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      hiretivoScore: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          headline: true,
          bio: true,
          location: true,
          yearsExperience: true,
          primaryRole: true,
          workPreference: true,
          situation: true,
          availability: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          resumeKey: true,
          websiteUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          twitterUrl: true,
          skills: {
            select: {
              level: true,
              skill: { select: { name: true } },
            },
            orderBy: { skill: { name: "asc" } },
          },
          workExperiences: {
            select: {
              id: true,
              company: true,
              title: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
              description: true,
              positionType: true,
              skills: true,
            },
            orderBy: { startDate: "desc" },
          },
          educations: {
            select: {
              id: true,
              institution: true,
              graduationDate: true,
              degree: true,
              major: true,
            },
            orderBy: { graduationDate: "desc" },
          },
        },
      },
    },
  });

  if (!engineer) return new Response("Not Found", { status: 404 });

  const [unlock, savedRecord] = await Promise.all([
    prisma.engineerUnlock.findUnique({
      where: {
        recruiterId_engineerId: {
          recruiterId: session.user.id,
          engineerId: params.id,
        },
      },
    }),
    prisma.savedEngineer.findUnique({
      where: {
        recruiterId_engineerId: {
          recruiterId: session.user.id,
          engineerId: params.id,
        },
      },
    }),
  ]);

  const profile = engineer.seekerProfile;

  // Build the full TalentDetail-compatible shape
  const detail = {
    id: engineer.id,
    name: engineer.name,
    email: unlock ? engineer.email : null,
    image: engineer.image,
    headline: profile?.headline ?? null,
    bio: profile?.bio ?? null,
    location: profile?.location ?? null,
    yearsExperience: profile?.yearsExperience ?? null,
    primaryRole: profile?.primaryRole ?? null,
    availability: profile?.availability ?? null,
    resumeKey: !!profile?.resumeKey,
    resumeUrl:
      unlock && profile?.resumeKey
        ? resolveLogoUrl(profile.resumeKey)
        : null,
    skills:
      profile?.skills.map((s) => ({
        name: s.skill.name,
        category: "",
        level: s.level,
      })) ?? [],
    links: {
      websiteUrl: unlock ? (profile?.websiteUrl ?? null) : null,
      linkedinUrl: unlock ? (profile?.linkedinUrl ?? null) : null,
      githubUrl: unlock ? (profile?.githubUrl ?? null) : null,
      twitterUrl: unlock ? (profile?.twitterUrl ?? null) : null,
    },
    workExperiences:
      profile?.workExperiences.map((we) => ({
        id: we.id,
        company: we.company,
        title: we.title,
        startDate: we.startDate,
        endDate: we.endDate,
        isCurrent: we.isCurrent,
        description: we.description,
        positionType: we.positionType,
        skills: we.skills,
      })) ?? [],
    educations:
      profile?.educations.map((e) => ({
        id: e.id,
        institution: e.institution,
        graduationDate: e.graduationDate,
        degree: e.degree,
        major: e.major,
      })) ?? [],
    profile: {
      workPreference: profile?.workPreference ?? null,
      situation: profile?.situation ?? null,
      salaryMin: profile?.salaryMin ?? null,
      salaryMax: profile?.salaryMax ?? null,
      currency: profile?.currency ?? null,
    },
    // Keep backward-compatible fields for existing consumers
    hiretivoScore: engineer.hiretivoScore ?? 0,
    timezoneOverlapHours: engineer.timezoneOverlapHours ?? 0,
    availableFrom: engineer.availableFrom?.toISOString() ?? null,
    isUnlocked: !!unlock,
    isSaved: !!savedRecord,
  };

  return NextResponse.json({ data: detail });
}
