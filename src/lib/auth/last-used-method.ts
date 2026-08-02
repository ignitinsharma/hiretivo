export type AuthMethod = "google" | "email";
export type AuthSurface = "seeker";

export const LAST_USED_AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export const LAST_USED_AUTH_COOKIE_NAMES: Record<AuthSurface, string> = {
  seeker: "hiretivo_last_auth_seeker",
};

export const LAST_USED_AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: LAST_USED_AUTH_COOKIE_MAX_AGE_SECONDS,
};

export function parseAuthMethod(value: string | null | undefined): AuthMethod | null {
  if (value === "google" || value === "email") {
    return value;
  }

  return null;
}

function decodeCookieValue(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function getLastUsedAuthMethodFromCookieString(
  cookieString: string | null | undefined,
  surface: AuthSurface,
): AuthMethod | null {
  if (!cookieString) return null;

  const cookieName = LAST_USED_AUTH_COOKIE_NAMES[surface];
  const cookies = cookieString.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((entry) => entry.startsWith(`${cookieName}=`));

  if (!cookie) return null;

  const value = cookie.slice(cookieName.length + 1);
  return parseAuthMethod(decodeCookieValue(value));
}

export function getLastUsedAuthMethodFromDocument(surface: AuthSurface): AuthMethod | null {
  if (typeof document === "undefined") return null;

  return getLastUsedAuthMethodFromCookieString(document.cookie, surface);
}

export function setBrowserLastUsedAuthMethodCookie(
  surface: AuthSurface,
  method: AuthMethod,
): void {
  if (typeof document === "undefined") return;

  const cookieName = LAST_USED_AUTH_COOKIE_NAMES[surface];
  const secureAttribute = LAST_USED_AUTH_COOKIE_OPTIONS.secure ? "; Secure" : "";

  document.cookie = [
    `${cookieName}=${encodeURIComponent(method)}`,
    `Max-Age=${LAST_USED_AUTH_COOKIE_OPTIONS.maxAge}`,
    "Path=/",
    "SameSite=Lax",
  ].join("; ") + secureAttribute;
}

export function setLastUsedAuthMethodResponseCookie(
  response: {
    cookies: {
      set: (
        name: string,
        value: string,
        options: typeof LAST_USED_AUTH_COOKIE_OPTIONS,
      ) => void;
    };
  },
  surface: AuthSurface,
  method: AuthMethod,
): void {
  response.cookies.set(
    LAST_USED_AUTH_COOKIE_NAMES[surface],
    method,
    LAST_USED_AUTH_COOKIE_OPTIONS,
  );
}
