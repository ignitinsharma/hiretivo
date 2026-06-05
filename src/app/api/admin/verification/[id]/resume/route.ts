import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { isAdminSession } from "@/lib/admin/is-admin";
import { getSignedFileUrl } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";

const adminResumeViewLimiter = createRateLimiter(
  "admin-verification-resume",
  30,
  "1 m",
);

/*
 * GET /api/admin/verification/[id]/resume
 * Redirects an admin to a fresh signed URL for a seeker's private resume.
 * Resolves by seeker user id so resume keys are never exposed as user input.
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
  const { success } = await adminResumeViewLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      role: true,
      seekerProfile: { select: { resumeKey: true } },
    },
  });

  if (!user || user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!user.seekerProfile?.resumeKey) {
    return NextResponse.json({ error: "No resume found" }, { status: 404 });
  }

  const signedUrl = await getSignedFileUrl(user.seekerProfile.resumeKey);
  return NextResponse.redirect(signedUrl);
}
