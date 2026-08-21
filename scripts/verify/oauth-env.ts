import { strict as assert } from "node:assert";

const REQUIRED_VARS = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const;

const branch =
  process.env.VERCEL_GIT_COMMIT_REF ??
  process.env.GITHUB_REF_NAME ??
  process.env.VERCEL_BRANCH_URL ??
  "";
const isProduction = process.env.VERCEL_ENV === "production";
const isCanonicalBranch = ["main", "staging", "develop"].includes(branch);
const mustEnforce = isProduction || isCanonicalBranch;

const missing = REQUIRED_VARS.filter((name) => !(process.env[name] ?? "").trim());

if (mustEnforce) {
  assert.deepEqual(
    missing,
    [],
    `Google OAuth env vars missing on ${isProduction ? "production" : `branch "${branch}"`}: ${missing.join(", ")}. ` +
      `Add them to the Vercel project environment, then redeploy.`,
  );
  console.log(`oauth-env check passed (${isProduction ? "production" : branch})`);
} else if (missing.length > 0) {
  console.warn(
    `oauth-env: Google OAuth env vars missing (${missing.join(", ")}); ` +
      `skipping enforcement on "${branch || "local/dev"}" — Google sign-in will be hidden.`,
  );
} else {
  console.log("oauth-env check passed (vars present)");
}