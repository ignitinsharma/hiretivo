import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { dataFetchRateLimiter } from "@/lib/rate-limit";

interface RouteContext {
  params: { id: string };
}

type AdminSession = {
  user?: {
    id?: string;
    email?: string | null;
  };
} | null;

/*
 * requireAdmin
 * Checks whether the current session email matches ADMIN_EMAIL.
 * Returns true only for an authenticated configured admin user.
 */
function requireAdmin(session: AdminSession): boolean {
  if (!session?.user?.email) return false;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session.user.email.trim().toLowerCase();

  return Boolean(adminEmail && userEmail === adminEmail);
}

/*
 * GET /api/admin/verification/[id]
 * Returns full engineer verification submission detail for admin review.
 * Transitions PENDING submissions to IN_REVIEW when opened.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  const isAdmin = requireAdmin(session);
  if (!session?.user?.id || !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const engineer = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      verificationStatus: true,
      hiretivoScore: true,
      reapplyAfter: true,
      profileSlug: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          headline: true,
          bio: true,
          primaryRole: true,
          location: true,
          yearsExperience: true,
          githubUsername: true,
          githubScore: true,
          githubAnalysis: true,
          githubScannedAt: true,
          videoIntroUrl: true,
          topProjects: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          verificationNotes: true,
          verificationReviewedAt: true,
          verificationReviewedBy: true,
          skills: {
            select: {
              level: true,
              skill: { select: { name: true } },
            },
          },
          workExperiences: {
            select: {
              company: true,
              title: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
            },
          },
        },
      },
      verificationReviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          scoreGiven: true,
          notes: true,
          createdAt: true,
          reviewedBy: true,
        },
      },
    },
  });

  if (!engineer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const alreadyInReview = engineer.verificationStatus === VerificationStatus.IN_REVIEW;

  return NextResponse.json({
    engineer:
      engineer.verificationStatus === VerificationStatus.PENDING
        ? { ...engineer, verificationStatus: VerificationStatus.IN_REVIEW }
        : engineer,
    alreadyInReview,
  });
}
