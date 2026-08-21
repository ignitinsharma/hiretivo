import { NextRequest, NextResponse } from "next/server";
import { acquireLock, releaseLock } from "@/lib/ats/cron-lock";
import { fetchAndAutoClose } from "@/services/ats-job-fetcher.service";
import { AtsSource } from "@/constants/enums";
import { verifyCronSecret } from "../_verify-cron-secret";

/*
 * GET /api/cron/ats-fetch/ashby-lever
 * Vercel Cron — Hobby-safe combined cron for Ashby + Lever (2-cron split).
 * Runs Ashby then Lever sequentially within one 60s function (Lever lightest).
 * Auth: Bearer {CRON_SECRET}. Per-source cron-lock prevents overlap with manual runs.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  for (const source of [AtsSource.ASHBY, AtsSource.LEVER] as const) {
    const lockKey = `cron:ats-fetch:${source}`;
    const acquired = await acquireLock(lockKey);
    if (!acquired) {
      results[source] = { skipped: true, reason: "already running" };
      continue;
    }
    try {
      const result = await fetchAndAutoClose(source);
      console.log(`[cron:${source}]`, result);
      results[source] = result;
    } finally {
      await releaseLock(lockKey);
    }
  }

  return NextResponse.json(results);
}
