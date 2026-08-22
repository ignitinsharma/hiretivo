import { NextRequest, NextResponse } from "next/server";
import { acquireLock, releaseLock } from "@/lib/ats/cron-lock";
import { fetchAndAutoClose } from "@/services/ats-job-fetcher.service";
import { AtsSource } from "@/constants/enums";
import { verifyCronSecret } from "../_verify-cron-secret";

/*
 * GET /api/cron/ats-fetch/greenhouse
 * Vercel Cron — fetches and upserts Greenhouse jobs, then auto-closes stale ones.
 * Auth: Bearer {CRON_SECRET}. Cron-lock prevents concurrent runs.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lockKey = "cron:ats-fetch:greenhouse";
  const acquired = await acquireLock(lockKey);
  if (!acquired) {
    return NextResponse.json({ skipped: true, reason: "already running" });
  }
  try {
    const result = await fetchAndAutoClose(AtsSource.GREENHOUSE);
    console.log("[cron:greenhouse]", result);
    return NextResponse.json(result);
  } finally {
    await releaseLock(lockKey);
  }
}
