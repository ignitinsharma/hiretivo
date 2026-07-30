import { OAuthIntentSource } from "@/constants/enums";
import type { AuthError } from "next-auth";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const OAUTH_INTENT_COOKIE_NAME = "hiretivo_oauth_intent";

interface OAuthIntent {
  source: OAuthIntentSource;
  returnTo?: string;
}

export function setBrowserOAuthIntentCookie(
  source: OAuthIntentSource,
  returnTo?: string,
): void {
  if (typeof document === "undefined") return;
  const payload: OAuthIntent = { source };
  if (returnTo) payload.returnTo = returnTo;
  document.cookie = `${OAUTH_INTENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(payload))};path=/;max-age=300;samesite=lax`;
}

export function parseOAuthIntentCookieValue(
  value: string | undefined,
): OAuthIntent | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.source === "string"
    ) {
      return { source: parsed.source, returnTo: parsed.returnTo };
    }
    return null;
  } catch {
    return null;
  }
}

const OAUTH_AUTH_JS_ERROR_MAP: Record<string, string> = {
  OAuthAccountNotLinked: "account_not_linked",
  OAuthSignin: "oauth_signin",
  OAuthCallback: "oauth_callback",
  OAuthCreateAccount: "oauth_create_account",
  OAuthAccountNotLinked_Recruiter: "wrong_role_oauth",
  OAuthAccountNotLinked_Seeker: "wrong_role_oauth",
  default: "oauth_error",
};

export function mapOAuthAuthJsError(
  error: string | null,
): string {
  if (!error) return "unknown";
  return OAUTH_AUTH_JS_ERROR_MAP[error] ?? OAUTH_AUTH_JS_ERROR_MAP.default;
}

export function buildOAuthAuthErrorRedirectPath(
  authError: string,
  intent: OAuthIntent | null,
): string {
  if (!intent) return "/seeker/login";
  const base =
    intent.source === OAuthIntentSource.SEEKER_LOGIN
      ? "/seeker/login"
      : intent.source === OAuthIntentSource.SEEKER_REGISTER
        ? "/seeker/register"
        : "/seeker/login";
  const params = new URLSearchParams({ authError });
  if (intent.returnTo) params.set("redirect", intent.returnTo);
  return `${base}?${params.toString()}`;
}

export function clearOAuthIntentResponseCookie(
  response: { cookies: { set: (name: string, value: string, opts: Partial<ResponseCookie>) => void } },
): void {
  response.cookies.set(OAUTH_INTENT_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });
}

export { OAUTH_INTENT_COOKIE_NAME };
