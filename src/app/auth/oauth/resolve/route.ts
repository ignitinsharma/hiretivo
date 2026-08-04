import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") || "/dashboard";

  const sessionToken = req.cookies.get("authjs.session-token")?.value
    || req.cookies.get("__Secure-authjs.session-token")?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL(`/seeker/login?authError=no_session`, req.url));
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: { userId: true },
  });
  if (!session) {
    return NextResponse.redirect(new URL(`/seeker/login?authError=no_session`, req.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { onboardingCompleted: true },
  });

  if (!user?.onboardingCompleted) {
    return NextResponse.redirect(new URL(`/seeker/onboarding${next ? `?next=${encodeURIComponent(next)}` : ""}`, req.url));
  }

  return NextResponse.redirect(new URL(next, req.url));
}
