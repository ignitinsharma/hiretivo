import { auth } from "@/auth";
import { PlanTier, UserRole } from "@/constants/enums";
import { canAccessRecruiterPaidFeature } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { NextResponse } from "next/server";

interface TalentDetailRouteContext {
  params: {
    id: string;
  };
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

export async function GET(_req: Request, { params }: TalentDetailRouteContext) {
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

  const seeker = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: "SEEKER",
    },
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
          workPreference: true,
          situation: true,
          primaryRole: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          availability: true,
          resumeKey: true,
          skills: {
            select: {
              level: true,
              skill: { select: { name: true, category: true } },
            },
            orderBy: { skill: { name: "asc" } },
          },
        },
      },
      shortlistedByRecruiters: {
        where: { recruiterId: session.user.id },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!seeker?.seekerProfile) {
    return new Response("Not found", { status: 404 });
  }

  const profile = seeker.seekerProfile;

  return NextResponse.json({
    data: {
      id: seeker.id,
      name: seeker.name,
      email: seeker.email,
      image: resolveLogoUrl(seeker.image),
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      yearsExperience: profile.yearsExperience,
      primaryRole: profile.primaryRole,
      availability: profile.availability,
      resumeKey: Boolean(profile.resumeKey),
      isShortlisted: seeker.shortlistedByRecruiters.length > 0,
      skills: profile.skills.map((item) => ({
        name: item.skill.name,
        category: item.skill.category,
        level: item.level,
      })),
      profile: {
        workPreference: profile.workPreference,
        situation: profile.situation,
        salaryMin: profile.salaryMin,
        salaryMax: profile.salaryMax,
        currency: profile.currency,
      },
    },
  });
}
