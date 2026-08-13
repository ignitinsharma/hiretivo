import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";
import { addMonths, format } from "date-fns";
import { getFreeGenerationLimit } from "@/constants/pricing";

export enum QuotaType {
  RESUME = "RESUME",
  COVER_LETTER = "COVER_LETTER",
}

export const PLAN_GENERATION_LIMITS: Record<Exclude<PlanTier, "FREE">, number> = {
  [PlanTier.PRO]: 20,
  [PlanTier.UNLIMITED]: 9999,
};

export const PLAN_COVER_LETTER_LIMITS: Record<PlanTier, number> = {
  [PlanTier.FREE]: 10,
  [PlanTier.PRO]: 20,
  [PlanTier.UNLIMITED]: 9999,
};

/*
 * getPlanLimit
 * FREE resolves through getFreeGenerationLimit() at call time so the launch
 * promo (10/mo) auto-reverts to 5/mo the moment it ends — no stale module-level
 * constant on warm serverless instances.
 */
export function getPlanLimit(plan: PlanTier): number {
  if (plan === PlanTier.FREE) return getFreeGenerationLimit();
  return PLAN_GENERATION_LIMITS[plan] ?? 2;
}

function getCoverLetterLimit(plan: PlanTier): number {
  return PLAN_COVER_LETTER_LIMITS[plan] ?? 10;
}

function getCalendarMonth(): string {
  return format(new Date(), "yyyy-MM");
}

async function getUserPlanAndPeriod(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscription: {
        select: {
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  if (!user) return { plan: PlanTier.FREE, periodKey: getCalendarMonth(), resetsAt: "" };

  const sub = user.subscription;
  if (sub && sub.status === "ACTIVE" && sub.currentPeriodStart && sub.currentPeriodEnd) {
    return {
      plan: user.plan,
      periodKey: format(sub.currentPeriodStart, "yyyy-MM"),
      resetsAt: sub.currentPeriodEnd.toISOString(),
    };
  }

  return {
    plan: user.plan,
    periodKey: getCalendarMonth(),
    resetsAt: format(addMonths(new Date(), 1), "yyyy-MM-01'T'00:00:00'Z'"),
  };
}

export async function checkGenerationQuota(userId: string, type: QuotaType = QuotaType.RESUME) {
  const { plan, periodKey, resetsAt } = await getUserPlanAndPeriod(userId);

  const limit = type === QuotaType.COVER_LETTER ? getCoverLetterLimit(plan) : getPlanLimit(plan);

  const record = await prisma.generationQuota.findUnique({
    where: { userId_month_type: { userId, month: periodKey, type } },
  });

  const used = record?.count ?? 0;

  return { allowed: used < limit, used, limit, resetsAt, plan };
}

export async function consumeGenerationQuota(userId: string, type: QuotaType = QuotaType.RESUME) {
  const { periodKey } = await getUserPlanAndPeriod(userId);

  await prisma.generationQuota.upsert({
    where: { userId_month_type: { userId, month: periodKey, type } },
    update: { count: { increment: 1 } },
    create: { userId, month: periodKey, type, count: 1 },
  });
}
