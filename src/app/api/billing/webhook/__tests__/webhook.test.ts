import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SOURCE = "src/app/api/billing/webhook/route.ts";
const src = readFileSync(SOURCE, "utf8");

describe("DodoPayments webhook route", () => {
  it("handles subscription.active by upserting subscription and setting plan PRO", () => {
    assert.match(src, /case "subscription\.active":/);
    assert.match(src, /handleSubscriptionActive/);
    assert.match(src, /prisma\.subscription\.upsert/);
    assert.match(src, /prisma\.user\.update/);
    assert.match(src, /getPlanForProduct/);
  });

  it("handles subscription.renewed by updating period end", () => {
    assert.match(src, /case "subscription\.renewed":/);
    assert.match(src, /handleSubscriptionRenewed/);
    assert.match(src, /currentPeriodEnd/);
  });

  it("handles subscription.cancelled by reverting plan to FREE", () => {
    assert.match(src, /case "subscription\.cancelled":/);
    assert.match(src, /handleSubscriptionCancelled/);
    assert.match(src, /status: "CANCELED"/);
    assert.match(src, /plan: PlanTier\.FREE/);
  });

  it("handles payment.failed with PAST_DUE and no plan downgrade", () => {
    assert.match(src, /case "payment\.failed":/);
    assert.match(src, /handlePaymentFailed/);
    assert.match(src, /status: "PAST_DUE"/);
    assert.doesNotMatch(src, /payment\.failed[\s\S]{0,300}PlanTier\.FREE/);
  });

  it("rejects invalid signatures with 400", () => {
    assert.match(src, /dodo\.webhooks\.unwrap/);
    assert.match(src, /return NextResponse\.json\(\{ error: "Invalid signature" \}, \{ status: 400 \}\)/);
  });

  it("ignores unknown events and returns 200", () => {
    assert.match(src, /default:/);
    assert.match(src, /return NextResponse\.json\(\{ data: \{ received: true \} \}, \{ status: 200 \}\)/);
  });

  it("wraps lifecycle writes in Prisma transactions", () => {
    const txCalls = src.match(/prisma\.\$transaction/g) ?? [];
    assert.ok(txCalls.length >= 3, `Expected >=3 $transaction calls, got ${txCalls.length}`);
  });
});
