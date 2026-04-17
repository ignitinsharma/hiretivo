import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getStripePriceId } from "@/constants/stripe";
import { PlanTier, UserRole } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CheckoutRequestSchema } from "@/lib/validations/checkout.schema";

const checkoutRateLimiter = createRateLimiter("stripe-checkout", 5, "1 m");

function getAppUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.RECRUITER) {
    return NextResponse.json(
      { error: "This plan is for recruiters only" },
      { status: 403 },
    );
  }

  const { success } = await checkoutRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { planId, period, currency } = parsed.data;
  const priceId = getStripePriceId(planId, period, currency);
  if (!priceId) {
    return NextResponse.json(
      { error: "Selected plan is not available" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true, plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const stripeCustomerId =
    user.stripeCustomerId ??
    (
      await stripe.customers.create({
        email: user.email ?? session.user.email ?? undefined,
        metadata: { userId: session.user.id },
      })
    ).id;

  if (!user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId },
    });
  }

  const appUrl = getAppUrl(req);
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { userId: session.user.id },
    subscription_data: {
      metadata: {
        userId: session.user.id,
        plan: PlanTier.PRO,
      },
    },
  });

  return NextResponse.json(
    { data: { url: checkoutSession.url } },
    { status: 200 },
  );
}
