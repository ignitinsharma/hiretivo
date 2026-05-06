import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

/*
 * createRateLimiter
 * Creates a shared Upstash sliding-window limiter with the Hiretivo key prefix.
 * Returns a configured Ratelimit instance for API route handlers.
 */
export function createRateLimiter(
  id: string,
  maxRequests: number,
  window: Duration
): Ratelimit {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, window),
    prefix: `hiretivo:${id}`,
  });
}

/** POST /api/auth — 10 req/min per IP (per RULES.md) */
export const authPostRateLimiter = createRateLimiter("auth-post", 10, "1 m");

/** POST apply / upload style limits — reuse with distinct ids in routes */
export const applyRateLimiter = createRateLimiter("job-apply", 5, "1 m");

export const uploadRateLimiter = createRateLimiter("upload", 20, "1 m");

/** Public read endpoints such as job detail, logos, and skills. */
export const publicReadRateLimiter = createRateLimiter("public-read", 60, "1 m");

/** Authenticated read endpoints such as dashboards, settings, and saved jobs. */
export const dataFetchRateLimiter = createRateLimiter("data-fetch", 30, "1 m");

/** Heavy search/analytics endpoints such as talent search and application stats. */
export const searchRateLimiter = createRateLimiter("search", 20, "1 m");

/** Authenticated write endpoints such as save, dismiss, update, cancel. */
export const writeRateLimiter = createRateLimiter("write", 10, "1 m");

/** Public signup/registration-style endpoints. */
export const registerRateLimiter = createRateLimiter("register", 10, "1 m");

/*
 * getRateLimitIp
 * Extracts the best available client IP from proxy headers.
 * Returns "unknown" when no IP-like header is present.
 */
export function getRateLimitIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
