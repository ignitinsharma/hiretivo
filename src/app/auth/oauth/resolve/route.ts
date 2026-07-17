import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth, unstable_update } from "@/auth";
import { UserRole } from "@/constants/enums";
import {
  setLastUsedAuthMethodResponseCookie,
  type AuthSurface,
} from "@/lib/auth/last-used-method";
import {
  clearOAuthIntentResponseCookie,
  getOAuthIntentSourceAuthPath,
  getSafeOAuthNextPath,
  parseOAuthIntentSource,
} from "@/lib/auth/oauth-intent";
import { prisma } from "@/lib/prisma";

/*
 * getSafeNextPath
 * Validates a relative next path to prevent open redirects.
 * @param value - Candidate next path from query params.
 * @returns Safe relative path or null.
 */
function getSafeNextPath(value: string | null): string | null {
  return getSafeOAuthNextPath(value);
}

/*
 * getEntryRole
 * Parses and validates the entry role from query params.
 * @param value - Candidate role string.
 * @returns Valid UserRole or null.
 */
function getEntryRole(value: string | null): UserRole | null {
  if (value === UserRole.SEEKER || value === UserRole.RECRUITER) {
    return value;
  }

  return null;
}

/*
 * getSourceAuthPath
 * Maps source query params to their corresponding auth page paths.
 * @param value - Source identifier from query params.
 * @returns Source auth path or null.
 */
function getSourceAuthPath(value: string | null): string | null {
  return getOAuthIntentSourceAuthPath(parseOAuthIntentSource(value));
}

/*
 * buildRedirectResponse
 * Creates an absolute redirect response for this request context.
 * @param req - Incoming request.
 * @param path - Relative app path to redirect to.
 * @returns Redirect response.
 */
function buildRedirectResponse(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, req.url));
}

function getAuthSurfaceForRole(role: Role): AuthSurface {
  return role === Role.RECRUITER ? "recruiter" : "seeker";
}

function buildSuccessfulOAuthRedirectResponse(
  req: NextRequest,
  path: string,
  role: Role,
): NextResponse {
  const response = buildRedirectResponse(req, path);
  clearOAuthIntentResponseCookie(response);
  setLastUsedAuthMethodResponseCookie(
    response,
    getAuthSurfaceForRole(role),
    "google",
  );
  return response;
}

/*
 * GET /auth/oauth/resolve
 * Resolves OAuth post-login role routing, including first-time role assignment and mismatch handling.
 * Query params: entryRole, source, next.
 * Returns: Redirect response to auth/error/onboarding/dashboard destinations.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return buildRedirectResponse(req, "/");
  }

  const searchParams = req.nextUrl.searchParams;
  const userId = session.user.id;
  const entryRole = getEntryRole(searchParams.get("entryRole"));
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const sourcePath = getSourceAuthPath(searchParams.get("source"));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      onboardingCompleted: true,
      onboardingStep: true,
      passwordHash: true,
      seekerProfile: { select: { id: true } },
      recruiterProfile: { select: { id: true } },
    },
  });

  if (!user) {
    return buildRedirectResponse(req, "/");
  }

  const hasAnyProfile = Boolean(user.seekerProfile || user.recruiterProfile);
  const isLikelyFirstGoogleUser =
    !user.passwordHash &&
    !hasAnyProfile &&
    user.onboardingCompleted === false &&
    user.role === Role.SEEKER;

  let effectiveRole = user.role;

  if (
    !isLikelyFirstGoogleUser &&
    entryRole &&
    sourcePath &&
    user.role !== (entryRole as Role)
  ) {
    const mismatchPath = `${sourcePath}?authError=wrong_role_oauth&accountRole=${encodeURIComponent(user.role)}`;
    const response = buildRedirectResponse(req, mismatchPath);
    clearOAuthIntentResponseCookie(response);
    return response;
  }

  if (entryRole && isLikelyFirstGoogleUser) {
    effectiveRole = entryRole as Role;

    if (effectiveRole !== user.role) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: effectiveRole, onboardingStep: user.onboardingStep ?? 1 },
      });
    } else if (user.onboardingStep === null) {
      await prisma.user.update({
        where: { id: userId },
        data: { onboardingStep: 1 },
      });
    }

    await unstable_update({ user: { role: effectiveRole, onboardingStep: user.onboardingStep ?? 1 } });
  }

  if (!entryRole && isLikelyFirstGoogleUser) {
    const response = buildRedirectResponse(req, "/auth/select-role");
    clearOAuthIntentResponseCookie(response);
    return response;
  }

  if (user.onboardingCompleted === true) {
    if (nextPath) {
      return buildSuccessfulOAuthRedirectResponse(req, nextPath, effectiveRole);
    }

    return buildSuccessfulOAuthRedirectResponse(
      req,
      effectiveRole === Role.RECRUITER
        ? "/recruiter/dashboard"
        : "/dashboard",
      effectiveRole,
    );
  }

  return buildSuccessfulOAuthRedirectResponse(
    req,
    effectiveRole === Role.RECRUITER
      ? "/recruiter/onboarding"
      : "/seeker/onboarding",
    effectiveRole,
  );
}
