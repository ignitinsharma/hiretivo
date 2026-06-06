import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getDodoProductId, DODO_PRODUCT_TO_PLAN } from "@/constants/billing";
import { PlanTier, UserRole } from "@/constants/enums";
import { createRateLimiter } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { dodo } from "@/lib/dodo";
import { CheckoutRequestSchema } from "@/lib/validations/checkout.schema";
import { requireVerifiedEmailForTrustedAction } from "@/lib/auth/email-verification";

const checkoutRateLimiter = createRateLimiter("billing-checkout", 5, "1 m");

function getAppUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
}

/*
 * POST /api/billing/checkout
 * Creates a Dodo Payments subscription checkout session for STARTER/GROWTH/SCALE plans.
 * Requires RECRUITER role and a verified email address.
 * Returns a payment_link URL to redirect the user to.
 */
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

  const verificationError = await requireVerifiedEmailForTrustedAction(
    session.user.id,
  );
  if (verificationError) return verificationError;

  const { success } = await checkoutRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = CheckoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { planId, period, returnTo } = parsed.data;

  const productId = getDodoProductId(planId, period);
  if (!productId) {
    return NextResponse.json(
      { error: "Selected plan is not available" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, plan: true, billingCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.plan !== PlanTier.FREE) {
    return NextResponse.json(
      { error: "Use billing management for your current plan" },
      { status: 400 },
    );
  }

  const appUrl = getAppUrl(req);
  const returnUrl = new URL("/pricing/success", appUrl);
  if (returnTo) {
    returnUrl.searchParams.set("returnTo", returnTo);
  }

  const customerPayload = user.billingCustomerId
    ? ({ customer_id: user.billingCustomerId } as const)
    : ({
        email: user.email ?? session.user.email ?? "",
        name: user.name ?? session.user.name ?? "",
      } as const);

  const subscription = await dodo.subscriptions.create({
    billing: { country: "US" },
    customer: customerPayload,
    product_id: productId,
    quantity: 1,
    payment_link: true,
    return_url: returnUrl.toString(),
    metadata: {
      userId: session.user.id,
      plan: DODO_PRODUCT_TO_PLAN[productId] ?? PlanTier.FREE,
    },
  });

  if (subscription.customer.customer_id && !user.billingCustomerId) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { billingCustomerId: subscription.customer.customer_id },
    });
  }

  return NextResponse.json(
    { data: { url: subscription.payment_link } },
    { status: 200 },
  );
}
