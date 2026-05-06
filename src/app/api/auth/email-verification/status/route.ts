import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getEmailVerificationStatus } from "@/lib/auth/email-verification";
import { dataFetchRateLimiter } from "@/lib/rate-limit";

/*
 * GET /api/auth/email-verification/status
 * Returns the current authenticated user's email verification status.
 * Responds with status data or auth/not-found/rate-limit errors.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const status = await getEmailVerificationStatus(session.user.id);
  if (!status) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ data: status });
}
