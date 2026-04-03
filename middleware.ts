import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Use Node.js runtime — Prisma not supported in Edge Runtime
export const runtime = "nodejs";

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Routes that need NO guard (public, auth pages, API, static) ──
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/(public)") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/companies") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon");

  if (isPublicRoute) return NextResponse.next();

  // Auth-only routes (login, register, onboarding — accessible to authenticated users)
  const isAuthRoute =
    pathname.startsWith("/seeker/login") ||
    pathname.startsWith("/seeker/register") ||
    pathname.startsWith("/recruiter/login") ||
    pathname.startsWith("/recruiter/register") ||
    pathname.startsWith("/seeker/onboarding") ||
    pathname.startsWith("/recruiter/onboarding");

  // ── Unauthenticated: redirect to appropriate login ──
  if (!session?.user) {
    if (pathname.startsWith("/seeker/")) {
      return NextResponse.redirect(new URL("/seeker/login", req.url));
    }
    if (pathname.startsWith("/recruiter/")) {
      return NextResponse.redirect(new URL("/recruiter/login", req.url));
    }
    return NextResponse.next();
  }

  const userId = session.user.id;
  const userRole = session.user.role;
  const emailVerified = session.user.emailVerified;

  // ── Allow onboarding and auth routes for authenticated users (any role) ──
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // ── Seeker routes ──
  if (pathname.startsWith("/seeker/")) {
    // Wrong role: RECRUITER trying to access seeker routes
    if (userRole !== "SEEKER") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
    }

    // Check Steps 1+2 completion (per D-08)
    const seekerProfile = await prisma.seekerProfile.findUnique({
      where: { userId },
      select: { situation: true, primaryRole: true },
    });

    const isOnboarded =
      seekerProfile?.situation != null && seekerProfile?.primaryRole != null;

    if (!isOnboarded) {
      return NextResponse.redirect(new URL("/seeker/onboarding", req.url));
    }

    // Email verification gate for /seeker/dashboard only (per D-03)
    // Other /seeker/* routes (profile, settings, etc.) remain accessible to unverified users
    if (pathname.startsWith("/seeker/dashboard") && !emailVerified) {
      return NextResponse.redirect(new URL("/auth/verify-email-pending", req.url));
    }

    return NextResponse.next();
  }

  // ── Recruiter routes ──
  if (pathname.startsWith("/recruiter/")) {
    // Wrong role: SEEKER trying to access recruiter routes
    if (userRole !== "RECRUITER") {
      return NextResponse.redirect(new URL("/seeker/dashboard", req.url));
    }

    // Check RecruiterProfile exists (per D-08)
    const recruiterProfile = await prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!recruiterProfile) {
      return NextResponse.redirect(new URL("/recruiter/onboarding", req.url));
    }

    // Email verification gate for /recruiter/dashboard only (per D-03)
    // Other /recruiter/* routes remain accessible to unverified users
    if (pathname.startsWith("/recruiter/dashboard") && !emailVerified) {
      return NextResponse.redirect(new URL("/auth/verify-email-pending", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

// Match all non-static routes
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
