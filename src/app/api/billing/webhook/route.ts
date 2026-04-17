import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type {
  SubscriptionActiveWebhookEvent,
  SubscriptionCancelledWebhookEvent,
  SubscriptionRenewedWebhookEvent,
  PaymentFailedWebhookEvent,
} from "dodopayments/resources/webhooks/webhooks";
import type { Subscription } from "dodopayments/resources/subscriptions";
import type { Payment } from "dodopayments/resources/payments";
import { PlanTier } from "@/constants/enums";
import { DODO_PRODUCT_TO_PLAN } from "@/constants/billing";
import { createRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { dodo } from "@/lib/dodo";

export const runtime = "nodejs";

const webhookRateLimiter = createRateLimiter("billing-webhook", 100, "1 m");

type LocalSubStatus = "ACTIVE" | "PAST_DUE" | "CANCELED";

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function mapStatus(status: string): LocalSubStatus {
  if (status === "cancelled" || status === "expired") return "CANCELED";
  if (status === "on_hold" || status === "failed") return "PAST_DUE";
  return "ACTIVE";
}

function getPlanForProduct(productId: string): PlanTier {
  return DODO_PRODUCT_TO_PLAN[productId] ?? PlanTier.PRO;
}

async function handleSubscriptionActive(sub: Subscription): Promise<void> {
  const userId = sub.metadata?.userId;
  if (!userId) throw new Error("subscription.active missing userId in metadata");

  const status = mapStatus(sub.status);
  const plan = getPlanForProduct(sub.product_id);
  const periodStart = new Date(sub.created_at);
  const periodEnd = new Date(sub.next_billing_date);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { dodoSubscriptionId: sub.subscription_id },
      create: {
        dodoSubscriptionId: sub.subscription_id,
        productId: sub.product_id,
        status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
        userId,
      },
      update: {
        productId: sub.product_id,
        status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
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
  const existing = await prisma.subscription.findUnique({
    where: { dodoSubscriptionId: sub.subscription_id },
    select: { userId: true },
  });
  const userId = sub.metadata?.userId ?? existing?.userId;
  if (!userId) throw new Error(`subscription.renewed: no userId for ${sub.subscription_id}`);

  const status = mapStatus(sub.status);
  const plan = getPlanForProduct(sub.product_id);
  const periodEnd = new Date(sub.next_billing_date);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { dodoSubscriptionId: sub.subscription_id },
      create: {
        dodoSubscriptionId: sub.subscription_id,
        productId: sub.product_id,
        status,
        currentPeriodStart: new Date(sub.created_at),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
        userId,
      },
      update: {
        status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: status === "CANCELED" ? PlanTier.FREE : plan },
    }),
  ]);
}

async function handleSubscriptionCancelled(sub: Subscription): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { dodoSubscriptionId: sub.subscription_id },
    select: { userId: true },
  });
  if (!existing) return;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { dodoSubscriptionId: sub.subscription_id },
      data: {
        status: "CANCELED",
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(sub.next_billing_date),
      },
    }),
    prisma.user.update({
      where: { id: existing.userId },
      data: { plan: PlanTier.FREE },
    }),
  ]);
}

async function handlePaymentFailed(payment: Payment): Promise<void> {
  const subscriptionId =
    "subscription_id" in payment
      ? (payment as Payment & { subscription_id?: string }).subscription_id
      : undefined;
  if (!subscriptionId) return;

  const existing = await prisma.subscription.findUnique({
    where: { dodoSubscriptionId: subscriptionId },
    select: { userId: true },
  });
  if (!existing) return;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { dodoSubscriptionId: subscriptionId },
      data: { status: "PAST_DUE" },
    }),
  ]);
  // User plan NOT downgraded — grace period until subscription.cancelled fires.
}

export async function POST(req: NextRequest) {
  const { success } = await webhookRateLimiter.limit(getClientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const rawBody = await req.text();
  const reqHeaders = await headers();

  let event:
    | SubscriptionActiveWebhookEvent
    | SubscriptionRenewedWebhookEvent
    | SubscriptionCancelledWebhookEvent
    | PaymentFailedWebhookEvent
    | { type: string; data: unknown };

  try {
    event = dodo.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": reqHeaders.get("webhook-id") ?? "",
        "webhook-signature": reqHeaders.get("webhook-signature") ?? "",
        "webhook-timestamp": reqHeaders.get("webhook-timestamp") ?? "",
      },
      key: process.env.DODO_WEBHOOK_SECRET ?? "",
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
      case "payment.failed":
        await handlePaymentFailed((event as PaymentFailedWebhookEvent).data);
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
