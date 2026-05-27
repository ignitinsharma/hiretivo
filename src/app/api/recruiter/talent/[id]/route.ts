import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl, resolveLogoUrl } from "@/lib/r2";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

interface TalentDetailRouteContext {
  params: {
    id: string;
  };
}


/*
 * resolveResumeUrl
 * Creates a temporary browser URL for a private resume file.
 * Returns null when no key exists or signing fails.
 */
async function resolveResumeUrl(resumeKey: string | null): Promise<string | null> {
  if (!resumeKey) {
    return null;
  }

  try {
    return await getSignedFileUrl(resumeKey);
  } catch {
    return null;
  }
}

/*
 * GET /api/recruiter/talent/[id]
 * Returns the complete Talent Pool profile for paid recruiters.
 * Responds with profile detail or auth/plan/not-found/rate-limit errors.
 */
export async function GET(_req: Request, { params }: TalentDetailRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return new Response("Forbidden", { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (!canAccessTalentPool(recruiter?.plan)) {
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
          websiteUrl: true,
          linkedinUrl: true,
          githubUrl: true,
          twitterUrl: true,
          workExperiences: {
            orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }],
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
          },
          educations: {
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              institution: true,
              graduationDate: true,
              degree: true,
              major: true,
            },
          },
          skills: {
            select: {
              level: true,
              skill: { select: { name: true, category: true } },
            },
            orderBy: { skill: { name: "asc" } },
          },
        },
      },
    },
  });

  if (!seeker?.seekerProfile) {
    return new Response("Not found", { status: 404 });
  }

  const profile = seeker.seekerProfile;
  const resumeUrl = await resolveResumeUrl(profile.resumeKey);

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
      resumeUrl,
      skills: profile.skills.map((item) => ({
        name: item.skill.name,
        category: item.skill.category,
        level: item.level,
      })),
      links: {
        websiteUrl: profile.websiteUrl,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        twitterUrl: profile.twitterUrl,
      },
      workExperiences: profile.workExperiences,
      educations: profile.educations,
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
