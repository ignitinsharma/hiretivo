import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getDodoProductId,
  getPlanChangeDirection,
  getProductPeriod,
} from "@/constants/billing";
import { BillingPeriod, PlanTier, PricingTierId } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { dodo } from "@/lib/dodo";
import { ChangePlanRequestSchema } from "@/lib/validations/checkout.schema";

const previewChangeRateLimiter = createRateLimiter(
  "billing-preview-change",
  30,
  "1 m",
);

/*
 * GET /api/billing/preview-change?planId=<starter|growth|scale>
 *
 * Previews the cost of an in-app subscription plan change before the user confirms.
 * For upgrades, calls Dodo's previewChangePlan to get the exact prorated charge.
 * For downgrades, no Dodo call is needed — there is no immediate charge.
 *
 * Query params:
 *   planId  — Target plan: "starter" | "growth" | "scale"
 *
 * Response shape (success 200):
 *   { data: { direction: "upgrade" | "downgrade", chargeToday: number, currency: string, currentPeriodEnd: string } }
 *
 *   chargeToday is in the smallest currency unit as returned by Dodo (e.g. cents for USD).
 *   The frontend is responsible for display formatting via Intl.NumberFormat.
 *   NOTE: Dodo SDK docs reference "smallest currency unit (cents for USD)" for amount fields,
 *   so 100 = $1.00. This value is returned as-is without dividing by 100.
 *
 * Error responses:
 *   401  Unauthorized
 *   429  Too many requests
 *   400  Invalid planId / already on this plan / subscription not active
 *   502  Dodo API unavailable
 */
export async function GET(req: NextRequest) {
  /* ── 1. Auth guard ── */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ── 2. Rate limit — 30 req/min per userId (read tier) ── */
  const { success } = await previewChangeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  /* ── 3. Validate query params ── */
  const planId = req.nextUrl.searchParams.get("planId");
  const periodParam = req.nextUrl.searchParams.get("period");
  const parsed = ChangePlanRequestSchema.safeParse({
    planId,
    period: periodParam ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const targetPricingTierId: PricingTierId = parsed.data.planId;
  const requestedPeriod: BillingPeriod | undefined = parsed.data.period;

  /* ── 4. Load user + active subscription from DB ── */
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscription: {
        select: {
          dodoSubscriptionId: true,
          productId: true,
          status: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const subscription = user.subscription;

  if (!subscription || subscription.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Resolve your payment before changing plans" },
      { status: 400 },
    );
  }

  /* ── 5. Determine change direction + resolve target period ── */
  // Prisma PlanTier and local PlanTier share identical string values — double-cast is safe.
  const currentPlanTier = user.plan as unknown as PlanTier;
  const targetPlanTier = targetPricingTierId.toUpperCase() as PlanTier;
  const planDirection = getPlanChangeDirection(currentPlanTier, targetPlanTier);

  const currentPeriod = getProductPeriod(subscription.productId);
  if (!currentPeriod) {
    return NextResponse.json(
      { error: "Plan not available for your billing period" },
      { status: 400 },
    );
  }
  // For downgrades, always keep the current period — never let the UI toggle change
  // the billing cycle on a downgrade, to avoid accidental commitment changes.
  const targetPeriod: BillingPeriod =
    planDirection === "downgrade" ? currentPeriod : (requestedPeriod ?? currentPeriod);
  const isSamePeriod = targetPeriod === currentPeriod;

  // Block only when BOTH plan AND period are unchanged.
  // Same plan + different period = valid period switch → treat as upgrade.
  if (planDirection === "same" && isSamePeriod) {
    return NextResponse.json(
      { error: "Already on this plan" },
      { status: 400 },
    );
  }
  const effectiveDirection: "upgrade" | "downgrade" =
    planDirection === "same" ? "upgrade" : planDirection;

  /* ── 6. Downgrade: no immediate charge ── */
  if (effectiveDirection === "downgrade") {
    return NextResponse.json(
      {
        data: {
          direction: "downgrade" as const,
          chargeToday: 0,
          // currency omitted — chargeToday is always 0 for downgrades (do_not_bill mode)
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        },
      },
      { status: 200 },
    );
  }

  /* ── 7. Upgrade: call Dodo previewChangePlan ── */

  const targetProductId = getDodoProductId(targetPricingTierId, targetPeriod);
  if (!targetProductId) {
    return NextResponse.json(
      { error: "Plan not available for your billing period" },
      { status: 400 },
    );
  }

  // Call Dodo to get prorated charge preview
  let preview;
  try {
    preview = await dodo.subscriptions.previewChangePlan(
      subscription.dodoSubscriptionId,
      {
        product_id: targetProductId,
        proration_billing_mode: "prorated_immediately",
        quantity: 1,
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not fetch plan preview" },
      { status: 502 },
    );
  }

  const chargeToday = preview.immediate_charge.summary.total_amount;
  const currency = preview.immediate_charge.summary.currency;

  return NextResponse.json(
    {
      data: {
        direction: "upgrade" as const,
        chargeToday,
        currency,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      },
    },
    { status: 200 },
  );
}
