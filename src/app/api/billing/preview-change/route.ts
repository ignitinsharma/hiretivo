import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getDodoProductId,
  getPlanChangeDirection,
  getProductPeriod,
} from "@/constants/billing";
import { PlanTier, PricingTierId, UserRole } from "@/constants/enums";
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
 *   403  Forbidden (non-RECRUITER role)
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

  /* ── 2. Role guard — recruiters only ── */
  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json(
      { error: "This endpoint is for recruiters only" },
      { status: 403 },
    );
  }

  /* ── 3. Rate limit — 30 req/min per userId (read tier) ── */
  const { success } = await previewChangeRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  /* ── 4. Validate query param ── */
  const planId = req.nextUrl.searchParams.get("planId");
  const parsed = ChangePlanRequestSchema.safeParse({ planId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const targetPricingTierId: PricingTierId = parsed.data.planId;

  /* ── 5. Load user + active subscription from DB ── */
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      Subscription: {
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

  const subscription = user.Subscription;

  if (!subscription || subscription.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Resolve your payment before changing plans" },
      { status: 400 },
    );
  }

  /* ── 6. Determine change direction ── */
  // Convert PricingTierId (lowercase, e.g. "starter") → PlanTier (uppercase, e.g. "STARTER")
  // Cast user.plan from Prisma's PlanTier to our constants PlanTier (same string values)
  const currentPlanTier = user.plan as unknown as PlanTier;
  const targetPlanTier = targetPricingTierId.toUpperCase() as PlanTier;
  const direction = getPlanChangeDirection(currentPlanTier, targetPlanTier);

  if (direction === "same") {
    return NextResponse.json(
      { error: "Already on this plan" },
      { status: 400 },
    );
  }

  /* ── 7. Downgrade: no immediate charge ── */
  if (direction === "downgrade") {
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

  /* ── 8. Upgrade: call Dodo previewChangePlan ── */

  // Determine which Dodo product to upgrade to by matching the current billing period
  const currentPeriod = getProductPeriod(subscription.productId);
  if (!currentPeriod) {
    return NextResponse.json(
      { error: "Plan not available for your billing period" },
      { status: 400 },
    );
  }

  const targetProductId = getDodoProductId(targetPricingTierId, currentPeriod);
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
