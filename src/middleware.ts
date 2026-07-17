import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const userRole = session?.user?.role as string | undefined;

  if (pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = session?.user?.email?.trim().toLowerCase();
    const isAdminUser =
      session?.user?.isAdmin === true ||
      Boolean(adminEmail && userEmail && userEmail === adminEmail);
    if (!isAdminUser) {
      return NextResponse.redirect(new URL("/seeker/login", req.url));
    }
    return NextResponse.next();
  }

  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/unsubscribe");

  if (isPublicRoute) {
    if (session && pathname === "/") {
      const dest = session.user?.onboardingCompleted === false
        ? "/seeker/onboarding"
        : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  const isLoginOrRegister =
    pathname.startsWith("/seeker/login") ||
    pathname.startsWith("/seeker/register");

  const isOnboardingRoute = pathname.startsWith("/seeker/onboarding");

  if (!session) {
    if (isLoginOrRegister) return NextResponse.next();
    if (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/generate-resume"))
      return NextResponse.redirect(new URL("/seeker/login", req.url));
    return NextResponse.next();
  }

  if (isLoginOrRegister) {
    const dest = session.user?.onboardingCompleted === false
      ? "/seeker/onboarding"
      : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (isOnboardingRoute) {
    if (session?.user?.onboardingCompleted) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
