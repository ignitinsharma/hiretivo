/**
 * sync-dodo-subscriptions
 *
 * One-time backfill: sync subscriptions from Dodo into the local DB and
 * grant the corresponding plan. Mirrors the webhook's handleSubscriptionActive
 * logic (webhook/route.ts). Fixes users who paid before the webhook endpoint
 * pointed at a reachable URL.
 *
 * Run: pnpm exec tsx scripts/sync-dodo-subscriptions.ts
 */

import { PlanTier } from "../src/constants/enums";
import { DODO_PRODUCT_TO_PLAN, PLAN_RANK } from "../src/constants/billing";
import { dodo } from "../src/lib/dodo";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// src/lib/prisma imports "server-only" — can't be used outside Next.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

function mapStatus(status: string): "ACTIVE" | "CANCELED" | "PAST_DUE" {
  if (status === "cancelled" || status === "expired") return "CANCELED";
  if (status === "on_hold" || status === "failed") return "PAST_DUE";
  return "ACTIVE";
}

async function main() {
  const users = await prisma.user.findMany({
    where: { billingCustomerId: { not: null } },
    select: { id: true, email: true, plan: true, billingCustomerId: true },
  });

  if (users.length === 0) {
    console.log("No users with billingCustomerId. Nothing to sync.");
    return;
  }

  let synced = 0;
  let granted = 0;

  for (const user of users) {
    const subs = await dodo.subscriptions.list({
      customer_id: user.billingCustomerId!,
      page_size: 100, // ponytail: single customer never exceeds one page
    });

    if (!subs.items?.length) {
      console.log(`[${user.email}] no Dodo subscriptions`);
      continue;
    }

    let bestPlan: PlanTier | null = null;
    for (const sub of subs.items) {
      const status = mapStatus(sub.status);
      const plan = DODO_PRODUCT_TO_PLAN[sub.product_id] ?? null;
      if (
        plan &&
        status === "ACTIVE" &&
        (!bestPlan || PLAN_RANK[plan] > PLAN_RANK[bestPlan])
      ) {
        bestPlan = plan;
      }

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          dodoSubscriptionId: sub.subscription_id,
          productId: sub.product_id,
          status,
          currentPeriodStart: new Date(sub.previous_billing_date),
          currentPeriodEnd: new Date(sub.next_billing_date),
          cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
          userId: user.id,
        },
        update: {
          dodoSubscriptionId: sub.subscription_id,
          productId: sub.product_id,
          status,
          currentPeriodStart: new Date(sub.previous_billing_date),
          currentPeriodEnd: new Date(sub.next_billing_date),
          cancelAtPeriodEnd: sub.cancel_at_next_billing_date,
          scheduledPlan: null,
          scheduledChangeAt: null,
        },
      });
      synced++;
      console.log(`[${user.email}] ${sub.subscription_id} ${sub.product_id} -> ${status}`);
    }

    if (bestPlan && user.plan !== bestPlan) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: bestPlan },
      });
      granted++;
      console.log(`[${user.email}] plan ${user.plan} -> ${bestPlan}`);
    }
  }

  console.log(`Done. ${synced} subscription(s) upserted, ${granted} plan(s) granted.`);
}

main()
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
