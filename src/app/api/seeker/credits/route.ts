import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PlanTier, UserRole } from "@/constants/enums";
import { getSeekerCreditStatus } from "@/lib/billing/ai-daily-limit";
import { dataFetchRateLimiter } from "@/lib/rate-limit";

/*
 * GET /api/seeker/credits
 * Reads the seeker's remaining monthly AI credits without consuming one —
 * used for the apply wizard's soft credit-gate (Phase 8 hardens enforcement).
 * Response: {data: {remaining, limit}}.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await dataFetchRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // session.user.plan is @prisma/client's PlanTier (next-auth.d.ts augmentation);
  // app code uses the mirrored src/constants/enums.ts PlanTier (same string
  // values, distinct nominal type) — cast at this boundary only.
  const plan = session.user.plan as unknown as PlanTier;
  const status = await getSeekerCreditStatus(session.user.id, plan);

  return NextResponse.json({ data: status }, { status: 200 });
}
