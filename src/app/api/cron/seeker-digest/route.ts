import { NextResponse } from "next/server";

/*
 * GET /api/cron/seeker-digest
 * DISABLED in Pivot v2 - replaced by job-match-notification cron in Phase 11.
 * Returns 410 Gone so Vercel cron scheduler does not silently swallow errors.
 */
export async function GET() {
  return NextResponse.json(
    { error: "Seeker digest disabled - replaced by job-match-notification in Phase 11." },
    { status: 410 },
  );
}
