import { reserveSeekerCredit, refundSeekerCredit, getSeekerCreditStatus } from "@/lib/billing/ai-daily-limit";
import { PlanTier } from "@/constants/enums";
import { redis } from "@/lib/redis";

/*
 * main
 * Real-Redis proof (Phase 4) that reserveSeekerCredit -> refundSeekerCredit
 * nets zero consumption, that a plan's monthly cap is enforced, and that
 * refunding more times than reserved never grants credits above the plan
 * limit (the invariant the plan's Task 2 flagged as a residual risk).
 * Uses a disposable synthetic userId and deletes its key when done.
 */
async function main(): Promise<void> {
  const userId = `smoke-test-credit-user-${Date.now()}`;
  try {
    const before = await getSeekerCreditStatus(userId, PlanTier.FREE);
    console.log("before:", before);
    if (before.remaining !== 8 || before.limit !== 8) throw new Error("expected 8/8 before any use");

    const reserved = await reserveSeekerCredit(userId, PlanTier.FREE);
    console.log("after reserve #1:", reserved);
    if (!reserved.allowed || reserved.remaining !== 7) throw new Error("expected allowed=true, remaining=7");

    await refundSeekerCredit(userId);
    const afterRefund = await getSeekerCreditStatus(userId, PlanTier.FREE);
    console.log("after refund (net zero expected):", afterRefund);
    if (afterRefund.remaining !== 8) throw new Error("refund did not net zero");

    for (let i = 0; i < 8; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- sequential by design, exercising the same counter
      await reserveSeekerCredit(userId, PlanTier.FREE);
    }
    const exhausted = await reserveSeekerCredit(userId, PlanTier.FREE);
    console.log("9th reserve on FREE(8) (expect allowed=false):", exhausted);
    if (exhausted.allowed) throw new Error("expected quota exhausted");

    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- sequential by design
      await refundSeekerCredit(userId);
    }
    const afterOverRefund = await getSeekerCreditStatus(userId, PlanTier.FREE);
    console.log("after 10x refund past reserved count (must not exceed limit=8):", afterOverRefund);
    if (afterOverRefund.remaining > 8) throw new Error("over-refund granted more credits than the plan limit");

    console.log("\nAll seeker-credit-limiter invariants held.");
  } finally {
    await redis.del(`hiretivo:seeker-monthly-credit:${userId}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
