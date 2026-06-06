import {
  AuthErrorCode,
  OAuthIntentSource,
} from "@/constants/enums";

export interface OAuthIntent {
  source: OAuthIntentSource;
  next?: string;
}

export const OAUTH_INTENT_COOKIE_NAME = "hiretivo_oauth_intent";
export const OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS = 60 * 10;

export const OAUTH_INTENT_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS,
  httpOnly: false,
};

export const OAUTH_INTENT_CLEAR_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 0,
  httpOnly: false,
};

export function parseOAuthIntentSource(
  value: string | null | undefined,
): OAuthIntentSource | null {
  if (value === OAuthIntentSource.SEEKER_LOGIN) return OAuthIntentSource.SEEKER_LOGIN;
  if (value === OAuthIntentSource.SEEKER_REGISTER) return OAuthIntentSource.SEEKER_REGISTER;
  if (value === OAuthIntentSource.RECRUITER_LOGIN) return OAuthIntentSource.RECRUITER_LOGIN;
  if (value === OAuthIntentSource.RECRUITER_REGISTER) return OAuthIntentSource.RECRUITER_REGISTER;

  return null;
}

export function getOAuthIntentSourceAuthPath(
  source: OAuthIntentSource | null | undefined,
): string | null {
  if (source === OAuthIntentSource.SEEKER_LOGIN) return "/seeker/login";
  if (source === OAuthIntentSource.SEEKER_REGISTER) return "/seeker/register";
  if (source === OAuthIntentSource.RECRUITER_LOGIN) return "/recruiter/login";
  if (source === OAuthIntentSource.RECRUITER_REGISTER) return "/recruiter/register";

  return null;
}

export function getSafeOAuthNextPath(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\")) return null;

  return value;
}

export function createOAuthIntent(
  source: string | null | undefined,
  next?: string | null,
): OAuthIntent | null {
  const parsedSource = parseOAuthIntentSource(source);
  if (!parsedSource) return null;

  const safeNext = getSafeOAuthNextPath(next);
  return safeNext ? { source: parsedSource, next: safeNext } : { source: parsedSource };
}

export function serializeOAuthIntent(intent: OAuthIntent): string {
  return encodeURIComponent(JSON.stringify(intent));
}

export function parseOAuthIntentCookieValue(
  value: string | null | undefined,
): OAuthIntent | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as {
      source?: unknown;
      next?: unknown;
    };
    return createOAuthIntent(
      typeof parsed.source === "string" ? parsed.source : null,
      typeof parsed.next === "string" ? parsed.next : null,
    );
  } catch {
    return null;
  }
}

export function getOAuthIntentFromCookieString(
  cookieString: string | null | undefined,
): OAuthIntent | null {
  if (!cookieString) return null;

  const cookies = cookieString.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((entry) =>
    entry.startsWith(`${OAUTH_INTENT_COOKIE_NAME}=`)
  );

  if (!cookie) return null;

  return parseOAuthIntentCookieValue(
    cookie.slice(OAUTH_INTENT_COOKIE_NAME.length + 1),
  );
}

export function setBrowserOAuthIntentCookie(
  source: OAuthIntentSource,
  next?: string | null,
): void {
  if (typeof document === "undefined") return;

  const intent = createOAuthIntent(source, next);
  if (!intent) return;

  const secureAttribute = OAUTH_INTENT_COOKIE_OPTIONS.secure ? "; Secure" : "";
  document.cookie = [
    `${OAUTH_INTENT_COOKIE_NAME}=${serializeOAuthIntent(intent)}`,
    `Max-Age=${OAUTH_INTENT_COOKIE_OPTIONS.maxAge}`,
    "Path=/",
    "SameSite=Lax",
  ].join("; ") + secureAttribute;
}

export function setOAuthIntentResponseCookie(
  response: {
    cookies: {
      set: (
        name: string,
        value: string,
        options: typeof OAUTH_INTENT_COOKIE_OPTIONS,
      ) => void;
    };
  },
  intent: OAuthIntent,
): void {
  response.cookies.set(
    OAUTH_INTENT_COOKIE_NAME,
    serializeOAuthIntent(intent),
    OAUTH_INTENT_COOKIE_OPTIONS,
  );
}

export function clearOAuthIntentResponseCookie(response: {
  cookies: {
    set: (
      name: string,
      value: string,
      options: typeof OAUTH_INTENT_CLEAR_COOKIE_OPTIONS,
    ) => void;
  };
}): void {
  response.cookies.set(
    OAUTH_INTENT_COOKIE_NAME,
    "",
    OAUTH_INTENT_CLEAR_COOKIE_OPTIONS,
  );
}

export function mapOAuthAuthJsError(
  error: string | null | undefined,
): AuthErrorCode {
  if (error === "OAuthAccountNotLinked" || error === "AccountNotLinked") {
    return AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED;
  }

  return AuthErrorCode.OAUTH_SIGNIN_FAILED;
}

export function buildOAuthAuthErrorRedirectPath(
  authError: AuthErrorCode,
  intent: OAuthIntent | null,
): string {
  const targetPath =
    getOAuthIntentSourceAuthPath(intent?.source) ?? "/seeker/login";
  const params = new URLSearchParams({ authError });

  if (intent?.source === OAuthIntentSource.SEEKER_LOGIN && intent.next) {
    params.set("redirect", intent.next);
  }

  return `${targetPath}?${params.toString()}`;
}
