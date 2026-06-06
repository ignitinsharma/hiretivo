import { NextRequest, NextResponse } from "next/server";
import {
  buildOAuthAuthErrorRedirectPath,
  clearOAuthIntentResponseCookie,
  mapOAuthAuthJsError,
  OAUTH_INTENT_COOKIE_NAME,
  parseOAuthIntentCookieValue,
} from "@/lib/auth/oauth-intent";

/*
 * GET /auth/error
 * Converts Auth.js OAuth errors into app-owned auth page redirects.
 * Query params: error.
 * Returns: Redirect response to one of the four auth surfaces.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const intent = parseOAuthIntentCookieValue(
    req.cookies.get(OAUTH_INTENT_COOKIE_NAME)?.value,
  );
  const authError = mapOAuthAuthJsError(req.nextUrl.searchParams.get("error"));
  const redirectPath = buildOAuthAuthErrorRedirectPath(authError, intent);
  const response = NextResponse.redirect(new URL(redirectPath, req.url));
  clearOAuthIntentResponseCookie(response);

  return response;
}
