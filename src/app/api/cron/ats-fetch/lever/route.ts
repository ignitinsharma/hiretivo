import { NextRequest, NextResponse } from "next/server";
import { acquireLock, releaseLock } from "@/lib/ats/cron-lock";
import { fetchAndAutoClose } from "@/services/ats-job-fetcher.service";
import { AtsSource } from "@/constants/enums";
import { verifyCronSecret } from "../_verify-cron-secret";

/*
 * GET /api/cron/ats-fetch/lever
 * Vercel/GitHub cron — fetches and upserts Lever jobs then auto-closes stale ones.
 * Kept separate for GitHub 3-platform daily triggers; Vercel uses ashby-lever combined for Hobby 2-cron split.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lockKey = "cron:ats-fetch:lever";
  const acquired = await acquireLock(lockKey);
  if (!acquired) {
    return NextResponse.json({ skipped: true, reason: "already running" });
  }
  try {
    const result = await fetchAndAutoClose(AtsSource.LEVER);
    console.log("[cron:lever]", result);
    return NextResponse.json(result);
  } finally {
    await releaseLock(lockKey);
  }
}
