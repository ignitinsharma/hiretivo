import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { canAccessTalentPool, getUnlockQuota } from "@/lib/billing/plan-access";
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

  if (!canAccessTalentPool(recruiter?.plan)) {
    return NextResponse.json({ error: "Upgrade to unlock engineer profiles" }, { status: 403 });
  }

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

  // Quota check: count source='talent_pool' unlocks in current billing period
  const quota = getUnlockQuota(recruiter?.plan);
  if (quota !== null && quota > 0) {
    const now = new Date();
    const periodStart = recruiter?.subscription?.currentPeriodStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = recruiter?.subscription?.currentPeriodEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usedThisPeriod = await prisma.engineerUnlock.count({
      where: {
        recruiterId: session.user.id,
        source: "talent_pool",
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    });

    if (usedThisPeriod >= quota) {
      return NextResponse.json(
        { error: `Unlock quota exhausted (${quota}/${quota} used this period). Upgrade to unlock more engineers.` },
        { status: 402 },
      );
    }
  }

  // Atomic insert — @@unique constraint handles race conditions
  try {
    await prisma.engineerUnlock.create({
      data: {
        recruiterId: session.user.id,
        engineerId: params.id,
        source: "talent_pool",
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
