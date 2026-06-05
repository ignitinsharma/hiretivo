import { auth } from "@/auth";
import { ApplicationStatus, InterviewStatus, PlanTier, UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl, resolveLogoUrl } from "@/lib/r2";
import { dataFetchRateLimiter } from "@/lib/rate-limit";
import { isRecruiterTrialActive } from "@/lib/recruiter-trial";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/*
 * parseLimit
 * Normalizes the applications page size query parameter.
 * Returns a safe positive limit capped at the configured maximum.
 */
function parseLimit(rawLimit: string | null): number {
  if (!rawLimit) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}

/*
 * parseStage
 * Converts the application stage query parameter into an enum value.
 * Returns null when the query value is absent or invalid.
 */
function parseStage(rawStage: string | null): ApplicationStatus | null {
  if (!rawStage) {
    return null;
  }

  if (!(rawStage in ApplicationStatus)) {
    return null;
  }

  return ApplicationStatus[rawStage as keyof typeof ApplicationStatus];
}

/*
 * GET /api/recruiter/applications
 * Lists recruiter-owned applications with filters, cursor pagination, and profile data.
 * Returns application rows plus pagination metadata or auth/rate-limit errors.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");
  const stage = parseStage(url.searchParams.get("stage"));
  const search = url.searchParams.get("search")?.trim() ?? "";
  const limit = parseLimit(url.searchParams.get("limit"));
  const cursor = url.searchParams.get("cursor");

  const where: {
    job: { recruiterId: string };
    jobId?: string;
    status?: ApplicationStatus;
    seeker?: {
      OR: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
      }>;
    };
  } = {
    job: { recruiterId: session.user.id },
  };

  if (jobId) {
    where.jobId = jobId;
  }
  if (stage) {
    where.status = stage;
  }
  if (search) {
    where.seeker = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const applications = await prisma.application.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      job: {
        select: {
          id: true,
          title: true,
          skills: {
            select: {
              skill: { select: { name: true } },
            },
          },
        },
      },
      interviews: {
        where: { status: InterviewStatus.SCHEDULED },
        take: 1,
        orderBy: { startsAt: "desc" },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          meetLink: true,
          notes: true,
          status: true,
          scheduledTimeZone: true,
        },
      },
      seeker: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          seekerProfile: {
            select: {
              resumeKey: true,
              primaryRole: true,
              headline: true,
              location: true,
              yearsExperience: true,
              websiteUrl: true,
              linkedinUrl: true,
              githubUrl: true,
              twitterUrl: true,
              workExperiences: { orderBy: { startDate: 'asc' as const } },
              educations: true,
              skills: {
                include: { skill: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const hasMore = applications.length > limit;
  const pageItems = hasMore ? applications.slice(0, limit) : applications;
  const nextCursor = hasMore
    ? (pageItems[pageItems.length - 1]?.id ?? null)
    : null;

  const result = await Promise.all(
    pageItems.map(async (app) => {
      const seeker = app.seeker;
      const profile = seeker.seekerProfile;
      let resumeUrl: string | null = null;
      if (profile?.resumeKey) {
        try {
          resumeUrl = await getSignedFileUrl(profile.resumeKey);
        } catch {
          resumeUrl = null;
        }
      }

      return {
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.job.title,
        jobSkills: app.job.skills.map((skill) => skill.skill.name),
        candidateName: seeker.name ?? "Anonymous",
        candidateEmail: seeker.email ?? "",
        candidateAvatar: resolveLogoUrl(seeker.image),
        primaryRole: profile?.primaryRole ?? null,
        headline: profile?.headline ?? null,
        location: profile?.location ?? null,
        skills: profile?.skills.map((s) => s.skill.name) ?? [],
        candidateProfile: {
          primaryRole: profile?.primaryRole ?? null,
          headline: profile?.headline ?? null,
          location: profile?.location ?? null,
          skills: profile?.skills.map((s) => s.skill.name) ?? [],
          yearsExperience: profile?.yearsExperience ?? null,
          websiteUrl: profile?.websiteUrl ?? null,
          linkedinUrl: profile?.linkedinUrl ?? null,
          githubUrl: profile?.githubUrl ?? null,
          twitterUrl: profile?.twitterUrl ?? null,
          workExperiences: profile?.workExperiences ?? [],
          educations: profile?.educations ?? [],
        },
        matchScore: app.matchScore,
        status: app.status,
        plan: recruiter?.plan ?? PlanTier.FREE,
        canScheduleInterviews: isRecruiterTrialActive() || recruiter?.plan !== PlanTier.FREE,
        canUseAi: isRecruiterTrialActive() || recruiter?.plan !== PlanTier.FREE,
        coverLetter: app.coverLetter,
        resumeUrl,
        appliedAt: app.createdAt.toISOString(),
        scheduledInterview: app.interviews[0] ?? null,
      };
    }),
  );

  return NextResponse.json({
    applications: result,
    meta: {
      recruiterPlan: recruiter?.plan ?? PlanTier.FREE,
      nextCursor,
      hasMore,
      limit,
    },
  });
}
