import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import { redis } from "@/lib/redis";

/*
 * GET /api/health
 * Liveness and readiness probe for uptime monitors and canary verification.
 * Pings Postgres and Redis. Returns 200 with per-dependency status when healthy,
 * 503 if any dependency fails. Cache-Control: no-store so monitors always see fresh state.
 * Rate-limited at 60/min per IP to prevent abuse of the public endpoint.
 */

const healthRateLimiter = createRateLimiter("health", 60, "1 m");

type DependencyStatus = "ok" | "down";

async function checkPrisma(): Promise<{ status: DependencyStatus; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function checkRedis(): Promise<{ status: DependencyStatus; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const pong = await redis.ping();
    if (pong !== "PONG") throw new Error(`unexpected redis response: ${pong}`);
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function GET(req: NextRequest) {
  const ip = getRateLimitIp(req);
  const { success } = await healthRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const [db, cache] = await Promise.all([checkPrisma(), checkRedis()]);

  const allOk = db.status === "ok" && cache.status === "ok";

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      time: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      checks: { db, redis: cache },
    },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
