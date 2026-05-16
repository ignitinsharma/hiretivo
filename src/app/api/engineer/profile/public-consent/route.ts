import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { UserRole, VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { verificationWriteRateLimiter } from "@/lib/rate-limit";

/*
 * POST /api/engineer/profile/public-consent
 * Records verified engineer consent to make their profile public.
 * Returns success after setting profilePublic and profilePublicConsentAt.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await verificationWriteRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.verificationStatus !== VerificationStatus.VERIFIED) {
    return NextResponse.json(
      { error: "Only VERIFIED engineers can make their profile public" },
      { status: 403 },
    );
  }

  await prisma.seekerProfile.update({
    where: { userId: session.user.id },
    data: { profilePublic: true, profilePublicConsentAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
