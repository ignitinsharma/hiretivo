import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRateLimitIp, publicReadRateLimiter } from "@/lib/rate-limit";
import { getAppUrl } from "@/lib/config";

/*
 * resultRedirect
 * Builds the verification outcome redirect URL for the auth UI.
 * Returns a NextResponse redirect with the status query parameter.
 */
function resultRedirect(status: string): NextResponse {
  return NextResponse.redirect(`${getAppUrl()}/auth/verify-email?status=${status}`);
}

/*
 * GET /api/auth/verify-email
 * Verifies an email token and marks the matching user as verified.
 * Returns a redirect describing success, missing token, invalid token, or expiry.
 */
export async function GET(req: NextRequest) {
  const { success } = await publicReadRateLimiter.limit(getRateLimitIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return resultRedirect("missing-token");
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return resultRedirect("invalid");
  }

  const normalizedEmail = email.toLowerCase();
  if (verificationToken.identifier.toLowerCase() !== normalizedEmail) {
    return resultRedirect("invalid");
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return resultRedirect("expired");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return resultRedirect("invalid");
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  return resultRedirect("success");
}
