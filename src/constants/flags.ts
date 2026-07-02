/*
 * Feature flags — build-time toggles read from NEXT_PUBLIC_* env.
 *
 * RECRUITER_ENABLED gates the entire recruiter surface (UI entry points +
 * route access) during the seeker-only pivot. When off, recruiter code,
 * Prisma models, and API routes stay intact — they simply become unreachable
 * via routing and hidden in the UI. Flip the env to `true` to restore them.
 *
 * Read as a NEXT_PUBLIC_* var so it is inlined for both server and client
 * bundles; unset resolves to `false` (recruiter hidden by default).
 */
export const RECRUITER_ENABLED =
  process.env.NEXT_PUBLIC_RECRUITER_ENABLED === "true";
