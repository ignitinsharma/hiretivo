import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { applyRateLimiter } from "@/lib/rate-limit";

/*
 * GET /api/engineer/data-export
 * Returns a GDPR/DPDP JSON export for the authenticated engineer.
 * Includes profile, applications, verification history, and recruiter unlock log.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await applyRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [user, seekerProfile, applications, verificationReviews, unlockLog] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          verificationStatus: true,
          hiretivoScore: true,
          profileSlug: true,
          timezoneOverlapHours: true,
          availableFrom: true,
          reapplyAfter: true,
        },
      }),
      prisma.seekerProfile.findUnique({
        where: { userId: session.user.id },
        select: {
          headline: true,
          bio: true,
          location: true,
          yearsExperience: true,
          primaryRole: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          githubUsername: true,
          videoIntroUrl: true,
          topProjects: true,
          profilePublic: true,
          profilePublicConsentAt: true,
        },
      }),
      prisma.application.findMany({
        where: { seekerId: session.user.id },
        select: {
          id: true,
          status: true,
          createdAt: true,
          source: true,
          job: { select: { id: true, title: true } },
        },
      }),
      prisma.verificationReview.findMany({
        where: { userId: session.user.id },
        select: {
          status: true,
          scoreGiven: true,
          notes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.engineerUnlock.findMany({
        where: { engineerId: session.user.id },
        select: { source: true, unlockedAt: true },
        orderBy: { unlockedAt: "desc" },
      }),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    seekerProfile,
    applications,
    verificationHistory: verificationReviews,
    profileUnlocks: unlockLog,
    notice:
      "This data export is provided under GDPR Article 20 and applicable DPDP data portability principles. Your profile was evaluated using AI assistance as part of the verification process.",
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="hiretivo-data-export-${session.user.id}.json"`,
    },
  });
}
