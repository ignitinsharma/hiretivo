import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const userRole = session?.user?.role as string | undefined;
  const hasKnownRole = userRole === "SEEKER" || userRole === "RECRUITER";

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
