import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/constants/enums";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(`${APP_URL}/auth/verify-email?error=missing_params`);
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return NextResponse.redirect(`${APP_URL}/auth/verify-email?error=invalid_token`);
  }

  if (verificationToken.identifier !== email) {
    return NextResponse.redirect(`${APP_URL}/auth/verify-email?error=invalid_token`);
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(`${APP_URL}/auth/verify-email?error=expired_token`);
  }

  // Mark user as verified
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, emailVerified: true, role: true },
  });

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/auth/verify-email?error=user_not_found`);
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  // Delete used token
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  // Redirect to appropriate dashboard
  const redirectTo =
    user.role === UserRole.RECRUITER
      ? `${APP_URL}/recruiter/dashboard`
      : `${APP_URL}/seeker/jobs`;

  return NextResponse.redirect(`${redirectTo}?verified=1`);
}
