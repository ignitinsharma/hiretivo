import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { RECRUITER_ENABLED } from "@/constants/flags";

const { auth } = NextAuth(authConfig);

/*
 * Route constants (pivot: seeker app lives at unprefixed `(app)` routes).
 * SEEKER_HOME is the post-login/onboarding destination and the recruiter-gate
 * fallback. The seeker AUTH routes (/seeker/login|register|onboarding) are NOT
 * retired — only the old seeker *pages* are (see LEGACY_SEEKER_REDIRECTS).
 */
const SEEKER_HOME = "/dashboard";
const SEEKER_LOGIN = "/seeker/login";
const SEEKER_ONBOARDING = "/seeker/onboarding";
const RECRUITER_HOME = "/recruiter/dashboard";
const RECRUITER_ONBOARDING = "/recruiter/onboarding";

/*
 * Retired legacy seeker pages → their canonical `(app)` equivalents.
 * Matched by exact path or `${prefix}/` so deep links (old emails/bookmarks)
 * land in the right place. Auth routes are intentionally excluded.
 */
const LEGACY_SEEKER_REDIRECTS: ReadonlyArray<{ prefix: string; to: string }> = [
  { prefix: "/seeker/dashboard", to: "/dashboard" },
  { prefix: "/seeker/applications", to: "/dashboard" },
  { prefix: "/seeker/saved-jobs", to: "/dashboard/browse" },
  { prefix: "/seeker/feed", to: "/dashboard/browse" },
  { prefix: "/seeker/settings", to: "/settings" },
];

/*
 * isAppRoute
 * True for the protected pivot seeker app surface (route group `(app)`).
 * These require a SEEKER session with completed onboarding.
 */
function isAppRoute(pathname: string): boolean {
  const roots = ["/dashboard", "/profile", "/settings", "/help"];
  return roots.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/*
 * Next.js middleware — single source of truth for route protection.
 * (Next.js runs only this file because the app lives under src/.)
 *
 * - /admin/*        : gated on isAdmin/ADMIN_EMAIL. Defense-in-depth; the admin
 *                     layout and every /api/admin handler re-check too.
 * - /recruiter/*    : hidden behind RECRUITER_ENABLED (pivot); role-gated when on.
 * - legacy /seeker/*: retired pages redirect to canonical `(app)` routes.
 * - /dashboard,/profile,/settings,/help : SEEKER app — require session + onboarding.
 * - public marketing/auth/api routes pass through (APIs enforce their own auth).
 *
 * ADMIN_EMAIL is read per-request so runtime-injected env (not build-time) is honored.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const userRole = session?.user?.role as string | undefined;
  const hasKnownRole = userRole === "SEEKER" || userRole === "RECRUITER";
  const isRecruiter = userRole === "RECRUITER";
  const onboardingIncomplete = session?.user?.onboardingCompleted === false;

  /* Build a redirect that preserves the incoming query string. */
  const redirect = (to: string) => {
    const url = new URL(to, req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  };

  /* Role-aware seeker/recruiter destination for a logged-in user. */
  const roleHome = () =>
    onboardingIncomplete
      ? isRecruiter
        ? RECRUITER_ONBOARDING
        : SEEKER_ONBOARDING
      : isRecruiter
        ? RECRUITER_HOME
        : SEEKER_HOME;

  // --- Recruiter gate (pivot): recruiter surface hidden unless flag on. ---
  // Covers recruiter pages plus its register/login entry points. Recruiter
  // code/models/APIs stay intact — they just become unreachable via routing.
  if (!RECRUITER_ENABLED && pathname.startsWith("/recruiter")) {
    return redirect(SEEKER_HOME);
  }

  // --- Admin gate (must run before the public check; /admin is not public) ---
  if (pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const userEmail = session?.user?.email?.trim().toLowerCase();
    const isAdminUser =
      session?.user?.isAdmin === true ||
      Boolean(adminEmail && userEmail && userEmail === adminEmail);
    if (!isAdminUser) {
      return redirect(SEEKER_LOGIN);
    }
    return NextResponse.next();
  }

  // --- Legacy /seeker/* retired pages → canonical `(app)` routes. ---
  // Runs before auth checks so old deep links resolve regardless of session
  // (the target route then applies its own protection).
  if (pathname === "/seeker" || pathname === "/seeker/") {
    return redirect(SEEKER_HOME);
  }
  for (const { prefix, to } of LEGACY_SEEKER_REDIRECTS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return redirect(to);
    }
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
      return redirect(roleHome());
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
    if (isAppRoute(pathname)) return redirect(SEEKER_LOGIN);
    if (pathname.startsWith("/seeker/"))
      return redirect(SEEKER_LOGIN);
    if (pathname.startsWith("/recruiter/"))
      return redirect("/recruiter/login");
    return NextResponse.next();
  }

  if (isLoginOrRegister) {
    if (!hasKnownRole) return NextResponse.next();
    return redirect(roleHome());
  }

  if (isOnboardingRoute) {
    if (session?.user?.onboardingCompleted) {
      return redirect(isRecruiter ? RECRUITER_HOME : SEEKER_HOME);
    }
    return NextResponse.next();
  }

  // --- Pivot seeker app routes: require a SEEKER with completed onboarding. ---
  if (isAppRoute(pathname)) {
    if (userRole !== "SEEKER") {
      return redirect(RECRUITER_ENABLED && isRecruiter ? RECRUITER_HOME : "/");
    }
    if (onboardingIncomplete) return redirect(SEEKER_ONBOARDING);
    return NextResponse.next();
  }

  if (!hasKnownRole) {
    return NextResponse.next();
  }

  // Remaining role mismatches on the surviving /seeker/* (auth) + /recruiter/* paths.
  if (pathname.startsWith("/recruiter/") && userRole !== "RECRUITER") {
    return redirect(SEEKER_HOME);
  }
  if (pathname.startsWith("/seeker/") && userRole !== "SEEKER") {
    return redirect(RECRUITER_ENABLED ? RECRUITER_HOME : "/");
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
