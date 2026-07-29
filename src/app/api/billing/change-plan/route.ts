import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getDodoProductId,
  DODO_PRODUCT_TO_PLAN,
  getPlanChangeDirection,
  getProductPeriod,
} from "@/constants/billing";
import { BillingPeriod, PlanTier, PricingTierId, UserRole } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { dodo } from "@/lib/dodo";
import { ChangePlanRequestSchema } from "@/lib/validations/checkout.schema";
import { requireVerifiedEmailForTrustedAction } from "@/lib/auth/email-verification";

const changePlanRateLimiter = createRateLimiter("billing-change-plan", 5, "1 m");

/*
 * POST /api/billing/change-plan
 * Executes an in-app subscription plan switch for RECRUITER users.
 *
 * Upgrades apply immediately with prorated billing (charged today via Dodo).
 * Downgrades are scheduled for the next billing date — no immediate charge.
 *
 * Body: { planId: "starter" | "growth" | "scale" }
 *
 * Response (upgrade):
 *   200  { data: { direction: "upgrade" } }
 *       user.plan is updated later by the subscription.active webhook.
 *
 * Response (downgrade):
 *   200  { data: { direction: "downgrade", scheduledChangeAt: ISO string } }
 *       scheduledPlan/scheduledChangeAt written to DB optimistically;
 *       user.plan is updated at renewal by the subscription.renewed webhook.
 *
 * Error responses:
 *   401  Unauthorized
 *   403  Forbidden (non-RECRUITER role or unverified email)
 *   429  Too many requests
 *   400  Body invalid / not on an active plan / already on this plan / product unavailable
 *   502  Dodo API call failed
 */
export async function POST(req: NextRequest) {
  /* ── 1. Auth guard ── */
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ── 2. Role guard — recruiters only ── */
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json(
      { error: "This endpoint is for recruiters only" },
      { status: 403 },
    );
  }

  /* ── 3. Verified email guard ── */
  const verificationError = await requireVerifiedEmailForTrustedAction(
    session.user.id,
  );
  if (verificationError) return verificationError;

  /* ── 4. Rate limit — 5 req/min per userId (write tier) ── */
  const { success } = await changePlanRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  /* ── 5. Validate request body ── */
  const body: unknown = await req.json().catch(() => null);
  const parsed = ChangePlanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const targetPricingTierId: PricingTierId = parsed.data.planId;
  const requestedPeriod: BillingPeriod | undefined = parsed.data.period;

  /* ── 6. Load user + active subscription from DB ── */
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

  /* ── 7. Determine direction + resolve target period — server-side only ── */
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
  // Downgrades always keep the current period — never switch billing cycle on a downgrade.
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
  const direction: "upgrade" | "downgrade" =
    planDirection === "same" ? "upgrade" : planDirection;

  /* ── 8. Resolve target Dodo product ID ── */
  const targetProductId = getDodoProductId(targetPricingTierId, targetPeriod);
  if (!targetProductId) {
    return NextResponse.json(
      { error: "Plan not available for your billing period" },
      { status: 400 },
    );
  }

  /* ── 9a. Upgrade path — prorated charge today ── */
  if (direction === "upgrade") {
    try {
      // changePlan returns void — success = no throw
      await dodo.subscriptions.changePlan(
        subscription.dodoSubscriptionId,
        {
          product_id: targetProductId,
          proration_billing_mode: "prorated_immediately",
          quantity: 1,
          effective_at: "immediately",
        },
      );
    } catch {
      return NextResponse.json(
        { error: "Could not process plan change" },
        { status: 502 },
      );
    }

    // Clear any queued downgrade — non-fatal, webhook will reconcile
    // NOTE: user.plan is intentionally NOT updated here. The subscription.active
    // webhook (cryptographically signed by Dodo) is the sole authoritative writer
    // of user.plan. The client uses optimistic JWT update for immediate UI feedback.
    try {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: { scheduledPlan: null, scheduledChangeAt: null },
      });
    } catch (err) {
      console.error("[change-plan] Failed to clear scheduled downgrade after upgrade:", err);
    }

    const upgradedPlan = DODO_PRODUCT_TO_PLAN[targetProductId];
    return NextResponse.json(
      { data: { direction: "upgrade", upgradedPlan } },
      { status: 200 },
    );
  }

  /* ── 9b. Downgrade path — scheduled for next renewal, no charge today ── */
  try {
    await dodo.subscriptions.changePlan(
      subscription.dodoSubscriptionId,
      {
        product_id: targetProductId,
        proration_billing_mode: "do_not_bill",
        quantity: 1,
        effective_at: "next_billing_date",
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not process plan change" },
      { status: 502 },
    );
  }

  // Write scheduled change to our DB optimistically — the webhook will overwrite at renewal
  // DB failure here is non-fatal; log and return success to the user
  const targetPlan = DODO_PRODUCT_TO_PLAN[targetProductId];
  if (!targetPlan) {
    // Should never happen — getDodoProductId and DODO_PRODUCT_TO_PLAN share the same source
    console.error("[change-plan] Product ID not in DODO_PRODUCT_TO_PLAN:", targetProductId);
    return NextResponse.json({ error: "Could not process plan change" }, { status: 502 });
  }

  try {
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        scheduledPlan: targetPlan as "FREE" | "STARTER" | "GROWTH" | "SCALE",
        scheduledChangeAt: subscription.currentPeriodEnd,
      },
    });
  } catch (err) {
    console.error("[change-plan] Failed to write scheduled downgrade to DB:", err);
  }

  // user.plan is NOT updated here — the subscription.renewed webhook will update it at renewal
  return NextResponse.json(
    {
      data: {
        direction: "downgrade",
        scheduledChangeAt: subscription.currentPeriodEnd.toISOString(),
      },
    },
    { status: 200 },
  );
}
