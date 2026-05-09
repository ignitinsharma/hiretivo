import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getEmailVerificationStatus } from "@/lib/auth/email-verification";
import { sendVerificationEmail } from "@/lib/email/verification";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";

const resendRateLimiter = createRateLimiter(
  "email-verification-resend",
  5,
  "15 m",
);

/*
 * POST /api/auth/email-verification/resend
 * Resends a verification email for authenticated users who still need verification.
 * Returns send confirmation or auth/validation/rate-limit errors.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getEmailVerificationStatus(session.user.id);
  if (!status) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (status.isVerified || !status.requiresVerification) {
    return NextResponse.json({ data: status });
  }

  if (!status.email) {
    return NextResponse.json(
      { error: "No email address is attached to this account" },
      { status: 400 },
    );
  }

  const { success } = await resendRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many verification emails. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  await sendVerificationEmail({
    email: status.email.toLowerCase(),
    recipientName: user?.name,
  });

  return NextResponse.json({ data: { sent: true } });
}
