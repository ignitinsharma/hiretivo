import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSignedFileUrl } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "RECRUITER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get("jobId");

  const where: { job: { recruiterId: string }; jobId?: string } = {
    job: { recruiterId: session.user.id },
  };
  if (jobId) {
    where.jobId = jobId;
  }

  const applications = await prisma.application.findMany({
    where,
    include: {
      job: { select: { id: true, title: true } },
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
              skills: {
                include: { skill: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = await Promise.all(
    applications.map(async (app) => {
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
        candidateName: seeker.name ?? "Anonymous",
        candidateEmail: seeker.email ?? "",
        candidateAvatar: seeker.image,
        primaryRole: profile?.primaryRole ?? null,
        headline: profile?.headline ?? null,
        location: profile?.location ?? null,
        skills: profile?.skills.map((s) => s.skill.name) ?? [],
        matchScore: app.matchScore,
        status: app.status,
        coverLetter: app.coverLetter,
        resumeUrl,
        appliedAt: app.createdAt.toISOString(),
      };
    }),
  );

  return NextResponse.json({ applications: result });
}
