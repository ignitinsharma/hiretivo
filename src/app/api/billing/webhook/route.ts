import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type {
  SubscriptionActiveWebhookEvent,
  SubscriptionCancelledWebhookEvent,
  SubscriptionRenewedWebhookEvent,
  PaymentFailedWebhookEvent,
} from "dodopayments/resources/webhooks/webhooks";
import type { Subscription } from "dodopayments/resources/subscriptions";
import { PlanTier } from "@/constants/enums";
import { DODO_PRODUCT_TO_PLAN } from "@/constants/billing";
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

function getPlanForProduct(productId: string): PlanTier {
  return DODO_PRODUCT_TO_PLAN[productId] ?? PlanTier.PRO;
}

async function handleSubscriptionActive(sub: Subscription): Promise<void> {
  const userId = sub.metadata?.userId;
  if (!userId) throw new Error("subscription.active missing userId in metadata");

  const status = mapStatus(sub.status);
  const plan = getPlanForProduct(sub.product_id);

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: status === "CANCELED" ? PlanTier.FREE : plan,
      billingCustomerId: sub.customer.customer_id,
    },
  });
}

async function handleSubscriptionRenewed(sub: Subscription): Promise<void> {
  const userId = sub.metadata?.userId;
  if (!userId) throw new Error(`subscription.renewed: no userId for ${sub.subscription_id}`);

  const status = mapStatus(sub.status);
  const plan = getPlanForProduct(sub.product_id);

  await prisma.user.update({
    where: { id: userId },
    data: { plan: status === "CANCELED" ? PlanTier.FREE : plan },
  });
}

async function handleSubscriptionCancelled(sub: Subscription): Promise<void> {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.warn(`subscription.cancelled: no userId in metadata for ${sub.subscription_id}`);
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { plan: PlanTier.FREE },
  });
}

// payment.failed — grace period, do not downgrade until subscription.cancelled fires
async function handlePaymentFailed(_sub: unknown): Promise<void> {
  // No action: user keeps current plan during grace period
  console.info("payment.failed received — no immediate plan downgrade");
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
