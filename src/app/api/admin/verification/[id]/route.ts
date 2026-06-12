import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { createRateLimiter } from "@/lib/rate-limit";

const adminVerificationDetailLimiter = createRateLimiter("admin-verification-detail", 30, "1 m");

/*
 * GET /api/admin/verification/[id]
 * Returns full engineer profile for an admin verification review.
 * Includes seekerProfile with skills, workExperiences, and educations.
 * Returns 403 for non-admin, 404 if user not found, 429 on rate limit.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { success } = await adminVerificationDetailLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      verificationStatus: true,
      seekerProfile: {
        select: {
          primaryRole: true,
          headline: true,
          bio: true,
          location: true,
          yearsExperience: true,
          workPreference: true,
          githubUrl: true,
          githubUsername: true,
          linkedinUrl: true,
          twitterUrl: true,
          websiteUrl: true,
          videoIntroUrl: true,
          topProjects: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          currency: true,
          availability: true,
          resumeKey: true,
          verificationNotes: true,
          submittedForReviewAt: true,
          skills: {
            select: {
              level: true,
              skill: { select: { name: true } },
            },
          },
          workExperiences: {
            orderBy: { createdAt: "asc" },
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
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              institution: true,
              degree: true,
              major: true,
              graduationDate: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = user.seekerProfile;

  return NextResponse.json({
    data: {
      userId: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      verificationStatus: user.verificationStatus,
      seekerProfile: profile
        ? {
            primaryRole: profile.primaryRole,
            headline: profile.headline,
            bio: profile.bio,
            location: profile.location,
            yearsExperience: profile.yearsExperience,
            workPreference: profile.workPreference,
            githubUrl: profile.githubUrl,
            githubUsername: profile.githubUsername,
            linkedinUrl: profile.linkedinUrl,
            twitterUrl: profile.twitterUrl,
            websiteUrl: profile.websiteUrl,
            videoIntroUrl: profile.videoIntroUrl,
            topProjects: profile.topProjects,
            salaryMinUsd: profile.salaryMinUsd,
            salaryMaxUsd: profile.salaryMaxUsd,
            currency: profile.currency,
            availability: profile.availability,
            resumeKey: profile.resumeKey,
            verificationNotes: profile.verificationNotes,
            submittedForReviewAt: profile.submittedForReviewAt?.toISOString() ?? null,
            skills: profile.skills.map((s) => ({
              name: s.skill.name,
              level: s.level,
            })),
            workExperiences: profile.workExperiences,
            educations: profile.educations,
          }
        : null,
    },
  });
}
