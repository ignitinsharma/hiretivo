import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { RECRUITER_ENABLED } from "@/constants/flags";

const { auth } = NextAuth(authConfig);

/*
 * Next.js middleware — single source of truth for route protection.
 * (Next.js runs only this file because the app lives under src/.)
 *
 * - /admin/*                : gated on ADMIN_EMAIL. Defense-in-depth; the admin
 *                             layout and every /api/admin handler re-check too.
 * - /seeker/*, /recruiter/* : require a session and the matching role; otherwise
 *                             redirect to the correct login / onboarding / dashboard.
 * - public marketing/auth/api routes pass through (APIs enforce their own auth).
 *
 * ADMIN_EMAIL is read per-request so runtime-injected env (not build-time) is honored.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const userRole = session?.user?.role as string | undefined;
  const hasKnownRole = userRole === "SEEKER" || userRole === "RECRUITER";

  // --- Recruiter gate (pivot): recruiter surface hidden unless flag on. ---
  // Covers recruiter pages plus its register/login entry points. Recruiter
  // code/models/APIs stay intact — they just become unreachable via routing.
  // Runs before the admin gate; /admin and /recruiter paths are disjoint.
  // Target is the pivot seeker home (route group `(app)` → /dashboard).
  if (!RECRUITER_ENABLED && pathname.startsWith("/recruiter")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // --- Admin gate (must run before the public check; /admin is not public) ---
  // Primary check: isAdmin boolean forwarded from JWT (DB-backed, set at sign-in).
  // Fallback: ADMIN_EMAIL env var (bootstrap path — keeps operator from being locked out).
  if (pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = session?.user?.email?.trim().toLowerCase();
    const isAdminUser =
      session?.user?.isAdmin === true ||
      Boolean(adminEmail && userEmail && userEmail === adminEmail);
    if (!isAdminUser) {
      return NextResponse.redirect(new URL("/recruiter/login", req.url));
    }
    return NextResponse.next();
  }

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/companies") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/hire-talent") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/how") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon");

  if (isPublicRoute) {
    if (session && pathname === "/") {
      const dest = session.user?.onboardingCompleted === false
        ? userRole === "RECRUITER"
          ? "/recruiter/onboarding"
          : "/seeker/onboarding"
        : userRole === "RECRUITER"
          ? "/recruiter/dashboard"
          : "/seeker/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  const isLoginOrRegister =
    pathname.startsWith("/seeker/login") ||
    pathname.startsWith("/seeker/register") ||
    pathname.startsWith("/recruiter/login") ||
    pathname.startsWith("/recruiter/register");

  const isOnboardingRoute =
    pathname.startsWith("/seeker/onboarding") ||
    pathname.startsWith("/recruiter/onboarding");

  if (!session) {
    if (isLoginOrRegister) return NextResponse.next();
    if (pathname.startsWith("/seeker/"))
      return NextResponse.redirect(new URL("/seeker/login", req.url));
    if (pathname.startsWith("/recruiter/"))
      return NextResponse.redirect(new URL("/recruiter/login", req.url));
    return NextResponse.next();
  }

  if (isLoginOrRegister) {
    if (!hasKnownRole) return NextResponse.next();
    const dest = session.user?.onboardingCompleted === false
      ? userRole === "RECRUITER"
        ? "/recruiter/onboarding"
        : "/seeker/onboarding"
      : userRole === "RECRUITER"
        ? "/recruiter/dashboard"
        : "/seeker/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (isOnboardingRoute) {
    if (session?.user?.onboardingCompleted) {
      const dest = userRole === "RECRUITER"
        ? "/recruiter/dashboard"
        : "/seeker/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (!hasKnownRole) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/seeker/") && userRole !== "SEEKER") {
    return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
  }
  if (pathname.startsWith("/recruiter/") && userRole !== "RECRUITER") {
    return NextResponse.redirect(new URL("/seeker/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
