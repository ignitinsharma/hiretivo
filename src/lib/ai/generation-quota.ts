import { prisma } from "@/lib/prisma";
import { PlanTier } from "@prisma/client";
import { addMonths, format } from "date-fns";

/*
 * PLAN_GENERATION_LIMITS
 * Monthly generation quota per plan tier.
 * Shared pool across resume generation + cover letter generation.
 * Regenerate and AI Rewrite edits do NOT consume quota.
 */
export const PLAN_GENERATION_LIMITS: Record<PlanTier, number> = {
  [PlanTier.FREE]: 2,
  [PlanTier.STARTER]: 20,
  [PlanTier.GROWTH]: 20,
  [PlanTier.SCALE]: 100,
};

/*
 * getCurrentMonth
 * Returns the current "YYYY-MM" string used as the month key in GenerationQuota.
 */
function getCurrentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

/*
 * checkGenerationQuota
 * Checks if a user has remaining generation quota for the current month.
 * Does NOT consume quota — use consumeGenerationQuota() after a successful generation.
 * @param userId - The user's ID
 * @returns { allowed: boolean; used: number; limit: number; resetsAt: string }
 */
export async function checkGenerationQuota(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) return { allowed: false, used: 0, limit: 0, resetsAt: "" };

  const month = getCurrentMonth();
  const limit = PLAN_GENERATION_LIMITS[user.plan] ?? 2;

  const record = await prisma.generationQuota.findUnique({
    where: { userId_month: { userId, month } },
  });

  const used = record?.count ?? 0;
  const resetsAt = format(addMonths(new Date(), 1), "yyyy-MM-01'T'00:00:00'Z'");

  return { allowed: used < limit, used, limit, resetsAt };
}

/*
 * consumeGenerationQuota
 * Increments the generation quota counter for a user for the current month.
 * Only call this AFTER a schema-valid AI response has been successfully saved.
 * @param userId - The user's ID
 */
export async function consumeGenerationQuota(userId: string) {
  const month = getCurrentMonth();

  await prisma.generationQuota.upsert({
    where: { userId_month: { userId, month } },
    update: { count: { increment: 1 } },
    create: { userId, month, count: 1 },
  });
}
