import { handlers } from "@/auth";
import { authPostRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export const { GET } = handlers;

/*
 * POST /api/auth/[...nextauth]
 * Applies the auth POST rate limit before delegating to Auth.js.
 * Returns Auth.js responses or 429 when the client IP exceeds the limit.
 */
export async function POST(req: NextRequest) {
  const { success } = await authPostRateLimiter.limit(getRateLimitIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  return handlers.POST(req);
}

export const runtime = "nodejs";
