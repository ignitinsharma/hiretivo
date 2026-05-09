import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  LAST_USED_AUTH_COOKIE_MAX_AGE_SECONDS,
  LAST_USED_AUTH_COOKIE_NAMES,
  LAST_USED_AUTH_COOKIE_OPTIONS,
  getLastUsedAuthMethodFromCookieString,
  parseAuthMethod,
  setLastUsedAuthMethodResponseCookie,
} from "../last-used-method";

describe("last used auth method cookies", () => {
  it("parses only supported auth methods", () => {
    assert.equal(parseAuthMethod("google"), "google");
    assert.equal(parseAuthMethod("email"), "email");
    assert.equal(parseAuthMethod("credentials"), null);
    assert.equal(parseAuthMethod("github"), null);
    assert.equal(parseAuthMethod(""), null);
    assert.equal(parseAuthMethod(undefined), null);
  });

  it("reads valid role-scoped cookie values and ignores tampered values", () => {
    assert.equal(
      getLastUsedAuthMethodFromCookieString(
        `${LAST_USED_AUTH_COOKIE_NAMES.seeker}=google`,
        "seeker",
      ),
      "google",
    );
    assert.equal(
      getLastUsedAuthMethodFromCookieString(
        `${LAST_USED_AUTH_COOKIE_NAMES.recruiter}=email`,
        "recruiter",
      ),
      "email",
    );
    assert.equal(
      getLastUsedAuthMethodFromCookieString(
        `${LAST_USED_AUTH_COOKIE_NAMES.seeker}=github`,
        "seeker",
      ),
      null,
    );
    assert.equal(
      getLastUsedAuthMethodFromCookieString(
        `${LAST_USED_AUTH_COOKIE_NAMES.seeker}=%E0%A4%A`,
        "seeker",
      ),
      null,
    );
  });

  it("uses the 90-day cookie policy without HttpOnly", () => {
    assert.equal(LAST_USED_AUTH_COOKIE_MAX_AGE_SECONDS, 60 * 60 * 24 * 90);
    assert.deepEqual(LAST_USED_AUTH_COOKIE_OPTIONS, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: LAST_USED_AUTH_COOKIE_MAX_AGE_SECONDS,
    });
    assert.equal("httpOnly" in LAST_USED_AUTH_COOKIE_OPTIONS, false);
  });

  it("writes response cookies with the scoped name and options", () => {
    const writes: unknown[] = [];
    const response = {
      cookies: {
        set: (...args: unknown[]) => {
          writes.push(args);
        },
      },
    };

    setLastUsedAuthMethodResponseCookie(response, "recruiter", "google");

    assert.deepEqual(writes, [
      [
        LAST_USED_AUTH_COOKIE_NAMES.recruiter,
        "google",
        LAST_USED_AUTH_COOKIE_OPTIONS,
      ],
    ]);
  });
});

describe("last used auth method integration guards", () => {
  const seekerLoginSource = readFileSync(
    "src/app/(auth)/seeker/login/page.tsx",
    "utf8",
  );
  const recruiterLoginSource = readFileSync(
    "src/app/(auth)/recruiter/login/page.tsx",
    "utf8",
  );
  const oauthResolverSource = readFileSync(
    "src/app/auth/oauth/resolve/route.ts",
    "utf8",
  );

  it("sets credentials cookies only after role validation succeeds", () => {
    assert.match(
      seekerLoginSource,
      /if \(session\?\.user\?\.role !== UserRole\.SEEKER\) \{[\s\S]*?return;\n      \}\n\n      toast\.success\("Welcome back!"\);\n      setBrowserLastUsedAuthMethodCookie\("seeker", "email"\);/,
    );
    assert.match(
      recruiterLoginSource,
      /if \(session\?\.user\?\.role !== UserRole\.RECRUITER\) \{[\s\S]*?return;\n      \}\n\n      toast\.success\("Welcome back!"\);\n      setBrowserLastUsedAuthMethodCookie\("recruiter", "email"\);/,
    );
  });

  it("does not set cookies on invalid credentials or role mismatch branches", () => {
    assert.doesNotMatch(
      seekerLoginSource.match(/if \(result\?\.error\) \{[\s\S]*?return;\n      \}/)?.[0] ?? "",
      /setBrowserLastUsedAuthMethodCookie/,
    );
    assert.doesNotMatch(
      recruiterLoginSource.match(/if \(result\?\.error\) \{[\s\S]*?return;\n      \}/)?.[0] ?? "",
      /setBrowserLastUsedAuthMethodCookie/,
    );
    assert.doesNotMatch(
      oauthResolverSource.match(/wrong_role_oauth[\s\S]*?return buildRedirectResponse\(req, mismatchPath\);/)?.[0] ?? "",
      /setLastUsedAuthMethodResponseCookie/,
    );
  });

  it("sets OAuth cookies only through successful resolver redirects", () => {
    assert.match(
      oauthResolverSource,
      /function buildSuccessfulOAuthRedirectResponse[\s\S]*?setLastUsedAuthMethodResponseCookie\([\s\S]*?"google"[\s\S]*?\);/,
    );
    assert.match(
      oauthResolverSource,
      /return buildSuccessfulOAuthRedirectResponse\(req, nextPath, effectiveRole\);/,
    );
    assert.match(
      oauthResolverSource,
      /return buildRedirectResponse\(req, "\/"\);/,
    );
  });

  it("renders Google and email last-used indicators only from matching cookies", () => {
    assert.match(
      seekerLoginSource,
      /showLastUsed=\{lastUsedAuthMethod === "google"\}/,
    );
    assert.match(
      recruiterLoginSource,
      /showLastUsed=\{lastUsedAuthMethod === "google"\}/,
    );
    assert.match(
      seekerLoginSource,
      /\{lastUsedAuthMethod === "email" && <AuthLastUsedBadge \/>\}/,
    );
    assert.match(
      recruiterLoginSource,
      /\{lastUsedAuthMethod === "email" && <AuthLastUsedBadge \/>\}/,
    );
  });
});
