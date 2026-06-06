import { strict as assert } from "node:assert";
import {
  AuthErrorCode,
  OAuthIntentSource,
} from "../../src/constants/enums";
import {
  buildOAuthAuthErrorRedirectPath,
  createOAuthIntent,
  getOAuthIntentSourceAuthPath,
  getSafeOAuthNextPath,
  mapOAuthAuthJsError,
  parseOAuthIntentCookieValue,
  serializeOAuthIntent,
} from "../../src/lib/auth/oauth-intent";

assert.equal(
  getOAuthIntentSourceAuthPath(OAuthIntentSource.SEEKER_LOGIN),
  "/seeker/login",
);
assert.equal(
  getOAuthIntentSourceAuthPath(OAuthIntentSource.SEEKER_REGISTER),
  "/seeker/register",
);
assert.equal(
  getOAuthIntentSourceAuthPath(OAuthIntentSource.RECRUITER_LOGIN),
  "/recruiter/login",
);
assert.equal(
  getOAuthIntentSourceAuthPath(OAuthIntentSource.RECRUITER_REGISTER),
  "/recruiter/register",
);

assert.equal(
  buildOAuthAuthErrorRedirectPath(AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED, null),
  "/seeker/login?authError=oauth_account_not_linked",
);

assert.equal(getSafeOAuthNextPath("/jobs/123"), "/jobs/123");
assert.equal(getSafeOAuthNextPath("jobs/123"), null);
assert.equal(getSafeOAuthNextPath("//evil.example"), null);
assert.equal(getSafeOAuthNextPath("https://evil.example"), null);
assert.equal(getSafeOAuthNextPath("/\\evil"), null);

const seekerLoginIntent = createOAuthIntent(
  OAuthIntentSource.SEEKER_LOGIN,
  "/jobs/123",
);
assert.equal(
  buildOAuthAuthErrorRedirectPath(
    AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED,
    seekerLoginIntent,
  ),
  "/seeker/login?authError=oauth_account_not_linked&redirect=%2Fjobs%2F123",
);

const unsafeNextIntent = createOAuthIntent(
  OAuthIntentSource.SEEKER_LOGIN,
  "https://evil.example",
);
assert.deepEqual(unsafeNextIntent, { source: OAuthIntentSource.SEEKER_LOGIN });

const parsedIntent = parseOAuthIntentCookieValue(
  serializeOAuthIntent({
    source: OAuthIntentSource.RECRUITER_REGISTER,
    next: "/ignored",
  }),
);
assert.deepEqual(parsedIntent, {
  source: OAuthIntentSource.RECRUITER_REGISTER,
  next: "/ignored",
});
assert.equal(
  buildOAuthAuthErrorRedirectPath(
    AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED,
    parsedIntent,
  ),
  "/recruiter/register?authError=oauth_account_not_linked",
);

assert.equal(
  mapOAuthAuthJsError("OAuthAccountNotLinked"),
  AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED,
);
assert.equal(
  mapOAuthAuthJsError("AccountNotLinked"),
  AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED,
);
assert.equal(
  mapOAuthAuthJsError("OAuthSignin"),
  AuthErrorCode.OAUTH_SIGNIN_FAILED,
);

console.log("oauth-intent checks passed");
