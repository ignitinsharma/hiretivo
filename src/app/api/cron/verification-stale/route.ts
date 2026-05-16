import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { subHours } from "date-fns";
import { VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { getRateLimitIp, publicReadRateLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * isAuthorizedCronRequest
 * Validates the x-cron-secret header against CRON_SECRET using constant-time comparison.
 * Returns false when either value is missing or lengths differ.
 */
function isAuthorizedCronRequest(req: NextRequest): boolean {
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (!cronSecret || !expectedSecret || cronSecret.length !== expectedSecret.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(cronSecret), Buffer.from(expectedSecret));
}

/*
 * GET /api/cron/verification-stale
 * Reverts IN_REVIEW verification submissions older than two hours to PENDING.
 * Requires CRON_SECRET via x-cron-secret and applies a public read rate limit.
 */
export async function GET(req: NextRequest) {
  const ip = getRateLimitIp(req);
  const { success } = await publicReadRateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleThreshold = subHours(new Date(), 2);
  const result = await prisma.user.updateMany({
    where: {
      verificationStatus: VerificationStatus.IN_REVIEW,
      updatedAt: { lt: staleThreshold },
    },
    data: { verificationStatus: VerificationStatus.PENDING },
  });

  return NextResponse.json({
    reverted: result.count,
    staleThreshold: staleThreshold.toISOString(),
  });
}
