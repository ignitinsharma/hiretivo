import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type {
  SubscriptionActiveWebhookEvent,
  SubscriptionCancelledWebhookEvent,
  SubscriptionExpiredWebhookEvent,
  SubscriptionFailedWebhookEvent,
  SubscriptionOnHoldWebhookEvent,
  SubscriptionRenewedWebhookEvent,
  PaymentFailedWebhookEvent,
  PaymentSucceededWebhookEvent,
} from "dodopayments/resources/webhooks/webhooks";
import type { Subscription } from "dodopayments/resources/subscriptions";
import type { Payment } from "dodopayments/resources/payments";
import { PlanTier } from "@/constants/enums";
import { DODO_PRODUCT_TO_PLAN } from "@/constants/billing";
import { BOOST_DURATION_MS } from "@/constants/boost";
import { createRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { dodo } from "@/lib/dodo";

export const runtime = "nodejs";

const webhookRateLimiter = createRateLimiter("billing-webhook", 100, "1 m");

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function mapStatus(status: string): "ACTIVE" | "CANCELED" | "PAST_DUE" {
  if (status === "cancelled" || status === "expired") return "CANCELED";
  if (status === "on_hold" || status === "failed") return "PAST_DUE";
  return "ACTIVE";
}

function getPlanForProduct(productId: string): PlanTier | null {
  return DODO_PRODUCT_TO_PLAN[productId] ?? null;
}

function getSubscriptionUserId(sub: Subscription): string | null {
  return sub.metadata?.userId ?? null;
}

/*
 * getPeriodEnd
 * Maps Dodo Subscription to DB currentPeriodEnd.
 * next_billing_date is required (string) — the monthly renewal date.
 * expires_at is optional (string | null) — 20-year subscription lifetime, NOT the renewal date.
 * Must never prefer expires_at over next_billing_date.
 */
function getPeriodEnd(sub: Subscription): Date {
  return new Date(sub.next_billing_date);
}

async function upsertSubscription(
  sub: Subscription,
  userId: string,
): Promise<void> {
  const status = mapStatus(sub.status);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      dodoSubscriptionId: sub.subscription_id,
      productId: sub.product_id,
      status,
      currentPeriodStart: new Date(sub.previous_billing_date),
      currentPeriodEnd: getPeriodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
      userId,
    },
    update: {
      dodoSubscriptionId: sub.subscription_id,
      productId: sub.product_id,
      status,
      currentPeriodStart: new Date(sub.previous_billing_date),
      currentPeriodEnd: getPeriodEnd(sub),
      cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
      userId,
    },
  });
}

async function handleSubscriptionActive(sub: Subscription): Promise<void> {
  const userId = getSubscriptionUserId(sub);
  if (!userId) throw new Error("subscription.active missing userId in metadata");

  const status = mapStatus(sub.status);
  const plan = getPlanForProduct(sub.product_id);
  if (!plan) {
    console.error(`Unknown product ID ${sub.product_id} — cannot determine plan tier. Skipping plan update.`);
    return;
  }

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        dodoSubscriptionId: sub.subscription_id,
        productId: sub.product_id,
        status,
        currentPeriodStart: new Date(sub.previous_billing_date),
        currentPeriodEnd: getPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
        userId,
      },
      update: {
        dodoSubscriptionId: sub.subscription_id,
        productId: sub.product_id,
        status,
        currentPeriodStart: new Date(sub.previous_billing_date),
        currentPeriodEnd: getPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
        scheduledPlan: null,
        scheduledChangeAt: null,
        userId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        plan: status === "CANCELED" ? PlanTier.FREE : plan,
        billingCustomerId: sub.customer.customer_id,
      },
    }),
  ]);
}

async function handleSubscriptionRenewed(sub: Subscription): Promise<void> {
  const userId = getSubscriptionUserId(sub);
  if (!userId) throw new Error(`subscription.renewed: no userId for ${sub.subscription_id}`);

  const status = mapStatus(sub.status);
  const plan = getPlanForProduct(sub.product_id);
  if (!plan) {
    console.error(`Unknown product ID ${sub.product_id} — cannot determine plan tier. Skipping plan update.`);
    return;
  }

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        dodoSubscriptionId: sub.subscription_id,
        productId: sub.product_id,
        status,
        currentPeriodStart: new Date(sub.previous_billing_date),
        currentPeriodEnd: getPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
        userId,
      },
      update: {
        dodoSubscriptionId: sub.subscription_id,
        productId: sub.product_id,
        status,
        currentPeriodStart: new Date(sub.previous_billing_date),
        currentPeriodEnd: getPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
        scheduledPlan: null,
        scheduledChangeAt: null,
        userId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: status === "CANCELED" ? PlanTier.FREE : plan },
    }),
  ]);
}

async function handleSubscriptionCancelled(sub: Subscription): Promise<void> {
  const userId = getSubscriptionUserId(sub);
  if (!userId) {
    console.warn(`subscription.cancelled: no userId in metadata for ${sub.subscription_id}`);
    return;
  }

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        dodoSubscriptionId: sub.subscription_id,
        productId: sub.product_id,
        status: "CANCELED",
        currentPeriodStart: new Date(sub.previous_billing_date),
        currentPeriodEnd: getPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
        userId,
      },
      update: {
        dodoSubscriptionId: sub.subscription_id,
        productId: sub.product_id,
        status: "CANCELED",
        currentPeriodStart: new Date(sub.previous_billing_date),
        currentPeriodEnd: getPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
        userId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: PlanTier.FREE },
    }),
  ]);
}

// payment.failed — grace period, do not downgrade until subscription.cancelled fires
async function handlePaymentFailed(payment: Payment): Promise<void> {
  if (!payment.subscription_id) {
    console.info("payment.failed received without subscription — no plan downgrade");
    return;
  }

  await prisma.subscription.updateMany({
    where: { dodoSubscriptionId: payment.subscription_id },
    data: { status: "PAST_DUE" },
  });
}

// INT-03: Activate a BoostedJob record on successful one-time boost payment.
// Upsert is idempotent — replaying the same event resets expiresAt to same value (T-13-14).
async function handleBoostPaymentSucceeded(
  data: PaymentSucceededWebhookEvent['data'],
): Promise<void> {
  const meta = data.metadata as Record<string, string> | undefined;
  if (!meta?.userId || !meta?.jobId || meta?.type !== 'boost') return;

  const { userId, jobId } = meta;

  // Idempotency: if this job's boost already came from this exact payment,
  // a duplicate webhook delivery must not reset/extend the boost window.
  const existingBoost = await prisma.boostedJob.findUnique({
    where: { jobId },
    select: { paymentId: true },
  });
  if (existingBoost?.paymentId === data.payment_id) return;

  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + BOOST_DURATION_MS);

  await prisma.boostedJob.upsert({
    where: { jobId },
    create: {
      jobId,
      recruiterId: userId,
      paymentId: data.payment_id,
      startsAt,
      expiresAt,
    },
    update: {
      recruiterId: userId,
      paymentId: data.payment_id,
      startsAt,
      expiresAt,
    },
  });
}

export async function POST(req: NextRequest) {
  const { success } = await webhookRateLimiter.limit(getClientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Fail closed: never verify with an empty key (would make forged events trivial).
    console.error("DODO_WEBHOOK_SECRET is not configured — rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const reqHeaders = await headers();

  let event:
    | SubscriptionActiveWebhookEvent
    | SubscriptionRenewedWebhookEvent
    | SubscriptionCancelledWebhookEvent
    | SubscriptionExpiredWebhookEvent
    | SubscriptionFailedWebhookEvent
    | SubscriptionOnHoldWebhookEvent
    | PaymentFailedWebhookEvent
    | PaymentSucceededWebhookEvent
    | { type: string; data: unknown };

  try {
    event = dodo.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": reqHeaders.get("webhook-id") ?? "",
        "webhook-signature": reqHeaders.get("webhook-signature") ?? "",
        "webhook-timestamp": reqHeaders.get("webhook-timestamp") ?? "",
      },
      key: webhookSecret,
    });
  } catch (error) {
    console.error("Invalid DodoPayments webhook signature:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "subscription.active":
        await handleSubscriptionActive(
          (event as SubscriptionActiveWebhookEvent).data,
        );
        break;
      case "subscription.renewed":
        await handleSubscriptionRenewed(
          (event as SubscriptionRenewedWebhookEvent).data,
        );
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(
          (event as SubscriptionCancelledWebhookEvent).data,
        );
        break;
      case "subscription.expired":
        await handleSubscriptionCancelled(
          (event as SubscriptionExpiredWebhookEvent).data,
        );
        break;
      case "subscription.failed":
      case "subscription.on_hold": {
        const sub = (event as SubscriptionFailedWebhookEvent | SubscriptionOnHoldWebhookEvent).data;
        const userId = getSubscriptionUserId(sub);
        if (!userId) {
          console.warn(`${event.type}: no userId in metadata for ${sub.subscription_id}`);
          break;
        }
        await upsertSubscription(sub, userId);
        break;
      }
      case "payment.failed":
        await handlePaymentFailed((event as PaymentFailedWebhookEvent).data);
        break;
      case "payment.succeeded":
        await handleBoostPaymentSucceeded(
          (event as PaymentSucceededWebhookEvent).data,
        );
        break;
      default:
        console.info(`Unhandled DodoPayments webhook event: ${event.type}`);
    }

    return NextResponse.json({ data: { received: true } }, { status: 200 });
  } catch (error) {
    console.error("Failed to process DodoPayments webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
