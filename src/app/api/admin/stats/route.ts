import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin/is-admin";
import { createRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import { getOverviewStats } from "@/modules/admin/utils/get-overview-stats";

const adminStatsReadLimiter = createRateLimiter("admin-stats-read", 30, "1 m");

/*
 * GET /api/admin/stats
 * Admin-gated, rate-limited stats aggregates endpoint. Reuses the shared
 * getOverviewStats builder (no duplicated query logic) so the API and the
 * /admin page always agree.
 *
 * Flow: auth() → isAdminSession 403 → rate-limit 429 → aggregate stats.
 *
 * @param req - Untrusted request (headers used for rate-limit IP only).
 * @returns 403 (non-admin), 429 (rate limited), or { data: OverviewStats }.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getRateLimitIp(req);
  const { success } = await adminStatsReadLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const stats = await getOverviewStats();
  return NextResponse.json({ data: stats });
}
