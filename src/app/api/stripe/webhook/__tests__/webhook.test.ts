import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const WEBHOOK_ROUTE_SOURCE = "src/app/api/stripe/webhook/route.ts";
const source = readFileSync(WEBHOOK_ROUTE_SOURCE, "utf8");

describe("Stripe webhook route", () => {
  it("handles checkout.session.completed by upserting a subscription and updating the user plan", () => {
    assert.match(source, /case "checkout\.session\.completed":/);
    assert.match(source, /handleCheckoutCompleted\(event\.data\.object\)/);
    assert.match(source, /stripe\.subscriptions\.retrieve\(subscriptionId\)/);
    assert.match(source, /prisma\.subscription\.upsert/);
    assert.match(source, /prisma\.user\.update/);
    assert.match(source, /plan: status === "CANCELED" \? PlanTier\.FREE : plan/);
  });

  it("handles customer.subscription.updated", () => {
    assert.match(source, /case "customer\.subscription\.updated":/);
    assert.match(source, /handleSubscriptionUpdated\(event\.data\.object\)/);
    assert.match(source, /subscription\.metadata\.userId \?\? existing\?\.userId/);
    assert.match(source, /cancelAtPeriodEnd: subscription\.cancel_at_period_end/);
  });

  it("handles customer.subscription.deleted", () => {
    assert.match(source, /case "customer\.subscription\.deleted":/);
    assert.match(source, /handleSubscriptionDeleted\(event\.data\.object\)/);
    assert.match(source, /status: "CANCELED"/);
    assert.match(source, /data: \{ plan: PlanTier\.FREE \}/);
  });

  it("handles invoice.payment_failed", () => {
    assert.match(source, /case "invoice\.payment_failed":/);
    assert.match(source, /handleInvoicePaymentFailed\(event\.data\.object\)/);
    assert.match(source, /data: \{ status: "PAST_DUE" \}/);
    assert.doesNotMatch(source, /invoice\.payment_failed"[\s\S]*PlanTier\.FREE/);
  });

  it("rejects invalid Stripe signatures with a 400 response", () => {
    assert.match(source, /headers\(\)\.get\("stripe-signature"\)/);
    assert.match(source, /stripe\.webhooks\.constructEvent/);
    assert.match(source, /return NextResponse\.json\(\{ error: "Invalid signature" \}, \{ status: 400 \}\)/);
  });

  it("ignores unknown webhook event types successfully", () => {
    assert.match(source, /default:/);
    assert.match(source, /Unhandled Stripe webhook event/);
    assert.match(source, /return NextResponse\.json\(\{ data: \{ received: true \} \}, \{ status: 200 \}\)/);
  });

  it("wraps subscription lifecycle writes in Prisma transactions", () => {
    const transactionCalls = source.match(/prisma\.\$transaction/g) ?? [];
    assert.ok(transactionCalls.length >= 4);
    assert.match(source, /STRIPE_PRICE_TO_PLAN\[stripePriceId\] \?\? PlanTier\.PRO/);
  });
});
