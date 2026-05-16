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
import { JobStatus, PlanTier } from "@/constants/enums";
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
  return DODO_PRODUCT_TO_PLAN[productId] ?? PlanTier.STARTER;
}

function getSubscriptionUserId(sub: Subscription): string | null {
  return sub.metadata?.userId ?? null;
}

function getPeriodEnd(sub: Subscription): Date {
  return new Date(sub.expires_at ?? sub.next_billing_date);
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

  // Auto-draft excess jobs for the NEW (FREE) plan limit
  await handleJobDowngrade(userId, PlanTier.FREE);
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

/*
 * handleJobDowngrade
 * When a recruiter's plan is downgraded, auto-drafts excess OPEN jobs
 * beyond the new plan's job posting limit. Most-recently-created jobs
 * are kept OPEN; oldest excess jobs become DRAFT.
 */
async function handleJobDowngrade(userId: string, newPlan: PlanTier): Promise<void> {
  const { getJobPostingLimit } = await import("@/lib/billing/plan-access");
  const newQuota = getJobPostingLimit(newPlan);
  if (newQuota === null) return; // unlimited — nothing to draft

  const openJobs = await prisma.job.findMany({
    where: { recruiterId: userId, status: JobStatus.OPEN },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const excess = openJobs.slice(newQuota);
  if (excess.length === 0) return;

  await prisma.job.updateMany({
    where: { id: { in: excess.map((j) => j.id) } },
    data: { status: JobStatus.DRAFT },
  });
  console.info(`[billing] Downgrade: auto-drafted ${excess.length} excess jobs for user ${userId}`);
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
        console.info("payment.succeeded received without subscription handling");
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
