import { NextRequest, NextResponse } from "next/server";
import { acquireLock, releaseLock } from "@/lib/ats/cron-lock";
import { fetchAndAutoClose } from "@/services/ats-job-fetcher.service";
import { AtsSource } from "@/constants/enums";
import { verifyCronSecret } from "../_verify-cron-secret";

/*
 * GET /api/cron/ats-fetch/ashby
 * Standalone Ashby fetch for GitHub 3-platform daily triggers.
 * Vercel uses ashby-lever combined for Hobby 2-cron split; this keeps Ashby separate for GitHub.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lockKey = "cron:ats-fetch:ashby";
  const acquired = await acquireLock(lockKey);
  if (!acquired) {
    return NextResponse.json({ skipped: true, reason: "already running" });
  }
  try {
    const result = await fetchAndAutoClose(AtsSource.ASHBY);
    console.log("[cron:ashby]", result);
    return NextResponse.json(result);
  } finally {
    await releaseLock(lockKey);
  }
}
