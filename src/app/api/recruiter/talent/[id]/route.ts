import { auth } from "@/auth";
import { UserRole, VerificationStatus } from "@/constants/enums";
import { canAccessTalentPool } from "@/lib/billing/plan-access";
import { coarseLocation, redactName } from "@/lib/billing/talent-redaction";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl, resolveLogoUrl } from "@/lib/r2";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

interface TalentDetailRouteContext {
  params: { id: string };
}

/*
 * resolveResumeUrl
 * Creates a temporary browser URL for a private resume file.
 * Returns null when no key exists or signing fails.
 */
async function resolveResumeUrl(resumeKey: string | null): Promise<string | null> {
  if (!resumeKey) return null;
  try {
    return await getSignedFileUrl(resumeKey);
  } catch {
    return null;
  }
}

type TalentProject = {
  title?: unknown;
  url?: unknown;
  description?: unknown;
};

function resolveTopProjects(rawProjects: unknown): Array<{
  title: string | null;
  url: string | null;
  description: string | null;
}> {
  if (!Array.isArray(rawProjects)) return [];
  return rawProjects
    .filter((project): project is TalentProject => {
      return typeof project === "object" && project !== null;
    })
    .map((project) => ({
      title: typeof project.title === "string" ? project.title : null,
      url: typeof project.url === "string" ? project.url : null,
      description:
        typeof project.description === "string" ? project.description : null,
    }));
}

/*
 * GET /api/recruiter/talent/[id]
 * Returns engineer profile in locked or unlocked shape based on EngineerUnlock record.
 * Only VERIFIED engineers are accessible. Requires STARTER/GROWTH/SCALE plan.
 * Locked shape: first name + last initial, skills, headline — no PII.
 * Unlocked shape: full PII including email, resume URL, social links.
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

  // Only VERIFIED engineers accessible — prevents ID-guessing attacks
  const engineer = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: "SEEKER",
      verificationStatus: "VERIFIED",
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
          githubUsername: true,
          videoIntroUrl: true,
          topProjects: true,
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

  if (!engineer?.seekerProfile) {
    return new Response("Not found", { status: 404 });
  }

  // Check if this recruiter has already unlocked this engineer
  const unlock = await prisma.engineerUnlock.findUnique({
    where: {
      recruiterId_engineerId: {
        recruiterId: session.user.id,
        engineerId: params.id,
      },
    },
    select: { id: true },
  });

  const isUnlocked = unlock !== null;
  const profile = engineer.seekerProfile;

  const skills = profile.skills.map((item) => ({
    name: item.skill.name,
    category: item.skill.category,
    level: item.level,
  }));

  if (!isUnlocked) {
    return NextResponse.json({
      data: {
        id: engineer.id,
        isUnlocked: false,
        // Talent pool only surfaces verified engineers (WHERE verificationStatus: VERIFIED).
        verificationStatus: VerificationStatus.VERIFIED,
        name: redactName(engineer.name), // server-side mask — real name never sent while locked
        image: resolveLogoUrl(engineer.image), // real avatar shown on locked card (product decision)
        email: null,
        headline: profile.headline,
        bio: null,
        location: coarseLocation(profile.location), // region only — no exact city while locked
        yearsExperience: profile.yearsExperience,
        primaryRole: profile.primaryRole,
        availability: profile.availability,
        githubUsername: null,
        videoIntroUrl: null,
        topProjects: [],
        resumeKey: false,
        resumeUrl: null,
        skills,
        links: null,
        workExperiences: [],
        educations: [],
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

  // Unlocked shape — full PII
  const resumeUrl = await resolveResumeUrl(profile.resumeKey);
  return NextResponse.json({
    data: {
      id: engineer.id,
      isUnlocked: true,
      // Talent pool only surfaces verified engineers (WHERE verificationStatus: VERIFIED).
      verificationStatus: VerificationStatus.VERIFIED,
      name: engineer.name,
      image: resolveLogoUrl(engineer.image),
      email: engineer.email,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      yearsExperience: profile.yearsExperience,
      primaryRole: profile.primaryRole,
      availability: profile.availability,
      githubUsername: profile.githubUsername,
      videoIntroUrl: profile.videoIntroUrl,
      topProjects: resolveTopProjects(profile.topProjects),
      resumeKey: Boolean(profile.resumeKey),
      resumeUrl,
      skills,
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
