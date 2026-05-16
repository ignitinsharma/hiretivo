import { NextResponse } from "next/server";
import { subHours } from "date-fns";
import { auth } from "@/auth";
import { VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { dataFetchRateLimiter } from "@/lib/rate-limit";

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
 * GET /api/admin/verification/queue
 * Returns PENDING and IN_REVIEW engineer verification submissions in FIFO order.
 * Also lazily reverts IN_REVIEW submissions older than two hours to PENDING.
 */
export async function GET() {
  const session = await auth();
  const isAdmin = requireAdmin(session);
  if (!session?.user?.id || !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const staleThreshold = subHours(new Date(), 2);
  await prisma.user.updateMany({
    where: {
      verificationStatus: VerificationStatus.IN_REVIEW,
      updatedAt: { lt: staleThreshold },
    },
    data: { verificationStatus: VerificationStatus.PENDING },
  });

  const submissions = await prisma.user.findMany({
    where: {
      verificationStatus: {
        in: [VerificationStatus.PENDING, VerificationStatus.IN_REVIEW],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      verificationStatus: true,
      profileSlug: true,
      updatedAt: true,
      createdAt: true,
      seekerProfile: {
        select: {
          headline: true,
          primaryRole: true,
          githubUsername: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          topProjects: true,
        },
      },
      verificationReviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, status: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ submissions });
}
