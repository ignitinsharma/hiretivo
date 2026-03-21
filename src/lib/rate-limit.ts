import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

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
