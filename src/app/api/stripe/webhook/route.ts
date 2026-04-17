import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { PlanTier } from "@/constants/enums";
import { STRIPE_PRICE_TO_PLAN } from "@/constants/stripe";
import { createRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const webhookRateLimiter = createRateLimiter("stripe-webhook", 100, "1 m");

type LocalSubStatus = "ACTIVE" | "PAST_DUE" | "CANCELED";

interface SubscriptionPeriod {
  stripePriceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

interface LegacyInvoiceWithSubscription {
  subscription?: string | Stripe.Subscription | null;
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

function getStripeId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function getSubscriptionPeriod(
  subscription: Stripe.Subscription,
): SubscriptionPeriod {
  const item = subscription.items.data[0];
  if (!item) {
    throw new Error(`Subscription ${subscription.id} has no items`);
  }

  return {
    stripePriceId: item.price.id,
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
  };
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): LocalSubStatus {
  if (status === "canceled") return "CANCELED";
  if (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete" ||
    status === "incomplete_expired"
  ) {
    return "PAST_DUE";
  }
  return "ACTIVE";
}

function getPlanForPrice(stripePriceId: string): PlanTier {
  return STRIPE_PRICE_TO_PLAN[stripePriceId] ?? PlanTier.PRO;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  if (invoice.parent?.type === "subscription_details") {
    return getStripeId(invoice.parent.subscription_details?.subscription);
  }

  // Stripe SDK v22 removed `invoice.subscription`; keep legacy support for older webhook payloads.
  const legacyInvoice = invoice as LegacyInvoiceWithSubscription;
  return getStripeId(legacyInvoice.subscription);
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.userId;
  const subscriptionId = getStripeId(session.subscription);
  const stripeCustomerId = getStripeId(session.customer);

  if (!userId || !subscriptionId) {
    throw new Error("Checkout session is missing userId or subscription ID");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const period = getSubscriptionPeriod(subscription);
  const plan = getPlanForPrice(period.stripePriceId);
  const status = mapSubscriptionStatus(subscription.status);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: period.stripePriceId,
        status,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        userId,
      },
      update: {
        stripePriceId: period.stripePriceId,
        status,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        plan: status === "CANCELED" ? PlanTier.FREE : plan,
        stripeCustomerId,
      },
    }),
  ]);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { userId: true },
  });
  const userId = subscription.metadata.userId ?? existing?.userId;

  if (!userId) {
    throw new Error(`Subscription ${subscription.id} is not linked to a user`);
  }

  const period = getSubscriptionPeriod(subscription);
  const status = mapSubscriptionStatus(subscription.status);
  const plan = getPlanForPrice(period.stripePriceId);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: period.stripePriceId,
        status,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        userId,
      },
      update: {
        stripePriceId: period.stripePriceId,
        status,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: status === "CANCELED" ? PlanTier.FREE : plan },
    }),
  ]);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select: { userId: true },
  });

  if (!existing) {
    return;
  }

  const period = getSubscriptionPeriod(subscription);

  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        stripePriceId: period.stripePriceId,
        status: "CANCELED",
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        cancelAtPeriodEnd: true,
      },
    }),
    prisma.user.update({
      where: { id: existing.userId },
      data: { plan: PlanTier.FREE },
    }),
  ]);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) {
    return;
  }

  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    select: { userId: true },
  });

  if (!existing) {
    return;
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: "PAST_DUE" },
    }),
  ]);

  // Note: User's plan tier is intentionally NOT downgraded here.
  // Users retain access during grace period — Stripe's dunning handles recovery.
  // Plan downgrade on subscription cancellation (handleSubscriptionDeleted) instead.
}

export async function POST(req: NextRequest) {
  const { success } = await webhookRateLimiter.limit(getClientIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.text();
  const signature = headers().get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch (error) {
    console.error("Invalid Stripe webhook signature:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.info(`Unhandled Stripe webhook event: ${event.type}`);
    }

    return NextResponse.json({ data: { received: true } }, { status: 200 });
  } catch (error) {
    console.error("Failed to process Stripe webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
