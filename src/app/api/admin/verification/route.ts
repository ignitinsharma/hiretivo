import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminSession } from "@/lib/admin/is-admin";
import { createRateLimiter } from "@/lib/rate-limit";

const adminVerificationReadLimiter = createRateLimiter("admin-verification-read", 30, "1 m");

/*
 * GET /api/admin/verification
 * Lists all seekers with PENDING or IN_REVIEW verification status.
 * Returns a lightweight row per user sufficient for the queue list UI.
 * Returns 403 for non-admin sessions, 429 on rate limit.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { success } = await adminVerificationReadLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const users = await prisma.user.findMany({
    where: {
      role: "SEEKER",
      verificationStatus: { in: ["PENDING", "IN_REVIEW"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      verificationStatus: true,
      seekerProfile: {
        select: {
          primaryRole: true,
          githubUrl: true,
          submittedForReviewAt: true,
        },
      },
    },
    orderBy: { seekerProfile: { submittedForReviewAt: "asc" } },
  });

  const data = users.map((u) => ({
    userId: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    primaryRole: u.seekerProfile?.primaryRole ?? null,
    githubUrl: u.seekerProfile?.githubUrl ?? null,
    submittedForReviewAt: u.seekerProfile?.submittedForReviewAt?.toISOString() ?? null,
    verificationStatus: u.verificationStatus,
  }));

  return NextResponse.json({ data });
}
