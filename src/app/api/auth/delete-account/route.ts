import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";

const deleteAccountRateLimiter = createRateLimiter(
  "delete-account",
  3,
  "1 m",
);

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await deleteAccountRateLimiter.limit(session.user.id);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.stripeCustomerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "active",
        limit: 1,
      });

      const activeSubscription = subscriptions.data[0];
      if (activeSubscription) {
        await stripe.subscriptions.cancel(activeSubscription.id, {
          prorate: true,
        });
      }
    } catch (error) {
      console.error("Failed to cancel Stripe subscription:", error);
      // Log error but don't block deletion per D-13
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      deletedAt: new Date(),
      name: "Deleted User",
      email: `deleted-${session.user.id}@hiretivo.invalid`,
      passwordHash: null,
      image: null,
    },
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
