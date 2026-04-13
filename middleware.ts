import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prismaEdge as prisma } from "@/lib/prisma-edge";

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ── Routes that need NO guard (public, auth pages, API, static) ──
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/companies") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon");

  if (isPublicRoute) {
    // Redirect logged-in users away from the landing page to their dashboard
    if (session?.user && pathname === "/") {
      const dest =
        session.user.role === "RECRUITER"
          ? "/recruiter/dashboard"
          : "/seeker/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Auth-only routes (login, register, onboarding — accessible to authenticated users)
  const isLoginOrRegister =
    pathname.startsWith("/seeker/login") ||
    pathname.startsWith("/seeker/register") ||
    pathname.startsWith("/recruiter/login") ||
    pathname.startsWith("/recruiter/register");

  const isAuthRoute =
    isLoginOrRegister ||
    pathname.startsWith("/seeker/onboarding") ||
    pathname.startsWith("/recruiter/onboarding");

  // ── Unauthenticated: redirect to appropriate login ──
  if (!session?.user) {
    // Allow unauthenticated access to login, register, and onboarding routes
    if (isAuthRoute) return NextResponse.next();
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

  // ── Redirect logged-in users away from login/register pages ──
  if (isLoginOrRegister) {
    const dest =
      userRole === "RECRUITER"
        ? "/recruiter/dashboard"
        : "/seeker/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // ── Allow onboarding routes for authenticated users (any role) ──
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // ── Seeker routes ──
  if (pathname.startsWith("/seeker/")) {
    // Wrong role: RECRUITER trying to access seeker routes
    if (userRole !== "SEEKER") {
      return NextResponse.redirect(
        new URL("/recruiter/dashboard?authError=wrong_role", req.url)
      );
    }

    // Check Steps 1+2 completion (per D-08)
    try {
      const seekerProfile = await prisma.seekerProfile.findUnique({
        where: { userId },
        select: { situation: true, primaryRole: true },
      });

      const isOnboarded =
        seekerProfile?.situation != null && seekerProfile?.primaryRole != null;

      if (!isOnboarded) {
        return NextResponse.redirect(new URL("/seeker/onboarding", req.url));
      }
    } catch (error) {
      console.error("Middleware DB check failed (seeker):", error);

      // If database tables don't exist yet (fresh deployment), allow request through
      // to avoid blocking all traffic during initial setup
      const errorMessage = error instanceof Error ? error.message : "";
      if (
        errorMessage.includes("does not exist") ||
        errorMessage.includes("relation")
      ) {
        console.warn("[middleware] Database tables not ready — allowing request through");
        return NextResponse.next();
      }

      // For other errors, fail open to avoid blocking traffic
      return NextResponse.next();
    }

    // Email verification gate for /seeker/dashboard only (per D-03)
    if (pathname.startsWith("/seeker/dashboard") && !emailVerified) {
      return NextResponse.redirect(new URL("/auth/verify-email-pending", req.url));
    }

    return NextResponse.next();
  }

  // ── Recruiter routes ──
  if (pathname.startsWith("/recruiter/")) {
    // Wrong role: SEEKER trying to access recruiter routes
    if (userRole !== "RECRUITER") {
      return NextResponse.redirect(
        new URL("/seeker/dashboard?authError=wrong_role", req.url)
      );
    }

    // Check RecruiterProfile exists (per D-08)
    try {
      const recruiterProfile = await prisma.recruiterProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!recruiterProfile) {
        return NextResponse.redirect(new URL("/recruiter/onboarding", req.url));
      }
    } catch (error) {
      console.error("Middleware DB check failed (recruiter):", error);

      const errorMessage = error instanceof Error ? error.message : "";
      if (
        errorMessage.includes("does not exist") ||
        errorMessage.includes("relation")
      ) {
        console.warn("[middleware] Database tables not ready — allowing request through");
        return NextResponse.next();
      }

      return NextResponse.next();
    }

    // Email verification gate for /recruiter/dashboard only (per D-03)
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
