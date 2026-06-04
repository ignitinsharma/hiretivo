/**
 * repair-subscription-period-end
 *
 * One-time script to fix subscriptions where currentPeriodEnd was incorrectly
 * stored as the Dodo expires_at value (e.g. 2046-06-04) instead of
 * next_billing_date (e.g. 2026-07-04).
 *
 * Root cause: webhook getPeriodEnd used `expires_at ?? next_billing_date`,
 * but expires_at is the 20-year subscription lifetime, not the monthly renewal.
 * Introduced May 6, 2026. Fixed in this commit.
 *
 * Before running:
 *   1. Confirm the correct next_billing_date from the Dodo dashboard.
 *   2. Set CORRECT_PERIOD_END below to that date (ISO 8601 UTC string).
 *   3. Run: npx tsx scripts/repair-subscription-period-end.ts
 */

import { prisma } from "../src/lib/prisma";

// Set this to the correct next_billing_date from Dodo's dashboard
// for the affected subscription(s).
const CORRECT_PERIOD_END = new Date("2026-07-04T00:00:00.000Z");

// Any currentPeriodEnd beyond this threshold is a corrupted value from expires_at.
// Dodo monthly subscriptions renew within ~1 year, so 5 years is a safe sentinel.
const CORRUPTION_THRESHOLD = new Date("2030-01-01T00:00:00.000Z");

async function main() {
  const corrupted = await prisma.subscription.findMany({
    where: {
      currentPeriodEnd: {
        gt: CORRUPTION_THRESHOLD,
      },
    },
    select: {
      id: true,
      userId: true,
      dodoSubscriptionId: true,
      currentPeriodEnd: true,
    },
  });

  if (corrupted.length === 0) {
    console.log("No corrupted rows found. Nothing to repair.");
    return;
  }

  console.log(`Found ${corrupted.length} corrupted row(s):`);
  for (const row of corrupted) {
    console.log(
      `  id=${row.id} userId=${row.userId} dodoId=${row.dodoSubscriptionId} currentPeriodEnd=${row.currentPeriodEnd.toISOString()}`,
    );
  }

  console.log(`\nUpdating currentPeriodEnd → ${CORRECT_PERIOD_END.toISOString()}`);

  const result = await prisma.subscription.updateMany({
    where: {
      currentPeriodEnd: {
        gt: CORRUPTION_THRESHOLD,
      },
    },
    data: {
      currentPeriodEnd: CORRECT_PERIOD_END,
    },
  });

  console.log(`Repaired ${result.count} row(s). Done.`);
}

main()
  .catch((err) => {
    console.error("Repair failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
