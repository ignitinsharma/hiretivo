import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { getUnlockQuotaConfig } from "@/lib/billing/plan-access";
import { prisma } from "@/lib/prisma";
import { writeRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

interface UnlockRouteContext {
  params: { id: string };
}

/*
 * POST /api/recruiter/talent/[id]/unlock
 * Atomically unlocks an engineer profile for the authenticated recruiter.
 * Enforces per-period quota (STARTER=10, GROWTH=30, SCALE=unlimited).
 * Idempotent: re-unlocking an already-unlocked engineer returns 200 immediately.
 * Only source='talent_pool' unlocks count against quota.
 */
export async function POST(_req: Request, { params }: UnlockRouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return new Response("Forbidden", { status: 403 });
  }

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscription: { select: { currentPeriodStart: true, currentPeriodEnd: true } },
    },
  });

  // Verify target engineer is VERIFIED
  const engineer = await prisma.user.findFirst({
    where: { id: params.id, role: "SEEKER", verificationStatus: "VERIFIED" },
    select: { id: true },
  });
  if (!engineer) {
    return new Response("Engineer not found", { status: 404 });
  }

  // Idempotency: already unlocked = free success
  const existing = await prisma.engineerUnlock.findUnique({
    where: {
      recruiterId_engineerId: {
        recruiterId: session.user.id,
        engineerId: params.id,
      },
    },
  });
  if (existing) {
    return NextResponse.json({ data: { unlocked: true, alreadyUnlocked: true } });
  }

  /*
   * Config-driven quota: FREE = 3 lifetime trial unlocks (source='trial'),
   * paid plans = per-billing-period quota (source='talent_pool'), SCALE = unlimited.
   */
  const config = getUnlockQuotaConfig(recruiter?.plan);

  if (config.limit === 0) {
    return NextResponse.json({ error: "Upgrade to unlock engineer profiles" }, { status: 403 });
  }

  // Period vars in scope here so the billing spread below can reference them
  const now = new Date();
  const periodStart = recruiter?.subscription?.currentPeriodStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = recruiter?.subscription?.currentPeriodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (config.limit !== null) {
    const usedCount = await prisma.engineerUnlock.count({
      where: {
        recruiterId: session.user.id,
        source: config.source,
        ...(config.period === "billing" && {
          createdAt: { gte: periodStart, lte: periodEnd },
        }),
      },
    });

    if (usedCount >= config.limit) {
      const msg =
        config.period === "lifetime"
          ? "You've used all 3 free trial unlocks. Upgrade to continue."
          : `Unlock quota exhausted (${config.limit}/${config.limit} used this period). Upgrade to unlock more engineers.`;
      return NextResponse.json({ error: msg }, { status: 402 });
    }
  }

  // Atomic insert — @@unique constraint handles race conditions
  try {
    await prisma.engineerUnlock.create({
      data: {
        recruiterId: session.user.id,
        engineerId: params.id,
        source: config.source,
      },
    });
  } catch (error) {
    // P2002 = unique constraint violation — concurrent unlock attempt, treat as idempotent
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ data: { unlocked: true, alreadyUnlocked: true } });
    }
    throw error;
  }

  return NextResponse.json({ data: { unlocked: true, alreadyUnlocked: false } });
}
