import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { canAccessTalentPool, getUnlockQuota } from "@/lib/billing/plan-access";
import { generatePageMetadata } from "@/lib/metadata";
import { TalentPoolClient } from "@/modules/recruiter/talent/components/TalentPoolClient";

export const metadata = generatePageMetadata({
  title: "Talent Pool",
  description: "Browse and unlock verified Indian engineers.",
});

/*
 * TalentPoolPage
 * Server component: loads recruiter plan, quota used, subscription data.
 * Passes to TalentPoolClient for interactive browse UX.
 */
export default async function TalentPoolPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== UserRole.RECRUITER) redirect("/seeker/dashboard");

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscription: { select: { currentPeriodStart: true, currentPeriodEnd: true } },
    },
  });

  const plan = recruiter?.plan ?? "FREE";
  const isFreePlan = !canAccessTalentPool(plan);
  const totalQuota = getUnlockQuota(plan);

  let usedQuota = 0;
  if (!isFreePlan && totalQuota !== null) {
    const periodStart = recruiter?.subscription?.currentPeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    usedQuota = await prisma.engineerUnlock.count({
      where: {
        recruiterId: session.user.id,
        source: "talent_pool",
        unlockedAt: { gte: periodStart },
      },
    });
  }

  return (
    <TalentPoolClient
      isFreePlan={isFreePlan}
      totalQuota={totalQuota}
      usedQuota={usedQuota}
      quotaResetAt={recruiter?.subscription?.currentPeriodEnd?.toISOString() ?? null}
    />
  );
}
