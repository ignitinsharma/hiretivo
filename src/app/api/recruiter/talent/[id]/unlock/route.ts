import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import {
  canAccessTalentPool,
  getUnlockQuota,
} from "@/lib/billing/plan-access";
import { sendUnlockNotificationEmail } from "@/lib/email/unlock-notification";
import { prisma } from "@/lib/prisma";
import { resolveLogoUrl } from "@/lib/r2";
import { writeRateLimiter } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/*
 * POST /api/recruiter/talent/[id]/unlock
 * Atomically unlocks an engineer profile for a recruiter.
 * Idempotent: repeat calls return cached unlock at no quota cost.
 * Quota counts only source='talent_pool' unlocks within billing period.
 * FREE plan: 429 UPGRADE_REQUIRED. Quota exhausted: 429 QUOTA_EXHAUSTED.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id)
    return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== UserRole.RECRUITER)
    return new Response("Forbidden", { status: 403 });

  const { success } = await writeRateLimiter.limit(session.user.id);
  if (!success) return new Response("Too Many Requests", { status: 429 });

  const recruiter = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      recruiterProfile: { select: { companyName: true } },
      subscription: {
        select: {
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  // 1. FREE plan check
  if (!canAccessTalentPool(recruiter?.plan)) {
    return NextResponse.json(
      { code: "UPGRADE_REQUIRED" },
      { status: 429 },
    );
  }

  // 2. Check idempotent: existing unlock?
  const existing = await prisma.engineerUnlock.findUnique({
    where: {
      recruiterId_engineerId: {
        recruiterId: session.user.id,
        engineerId: params.id,
      },
    },
  });

  if (existing) {
    // Return cached — load engineer PII
    const eng = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        name: true,
        email: true,
        hiretivoScore: true,
        seekerProfile: {
          select: {
            githubUrl: true,
            linkedinUrl: true,
            resumeKey: true,
          },
        },
      },
    });
    return NextResponse.json({
      data: {
        alreadyUnlocked: true,
        fullName: eng?.name ?? "",
        email: eng?.email ?? "",
        githubUrl: eng?.seekerProfile?.githubUrl ?? null,
        linkedinUrl: eng?.seekerProfile?.linkedinUrl ?? null,
        resumeUrl: eng?.seekerProfile?.resumeKey
          ? resolveLogoUrl(eng.seekerProfile.resumeKey)
          : null,
      },
    });
  }

  // 3. Verify engineer exists and is VERIFIED+public
  const engineer = await prisma.user.findFirst({
    where: {
      id: params.id,
      role: "SEEKER",
      verificationStatus: "VERIFIED",
      seekerProfile: { is: { profilePublic: true } },
      AND: [
        { OR: [{ hiddenUntil: null }, { hiddenUntil: { lt: new Date() } }] },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      seekerProfile: {
        select: {
          githubUrl: true,
          linkedinUrl: true,
          resumeKey: true,
        },
      },
    },
  });
  if (!engineer) return new Response("Not Found", { status: 404 });

  // 4. Atomic transaction: quota check + create EngineerUnlock
  const quota = getUnlockQuota(recruiter?.plan ?? "FREE");
  const periodStart =
    recruiter?.subscription?.currentPeriodStart ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const resetAt = recruiter?.subscription?.currentPeriodEnd ?? null;

  const unlockResult = await prisma.$transaction(async (tx) => {
    // Re-count quota inside transaction to prevent TOCTOU
    if (quota !== null) {
      const usedQuota = await tx.engineerUnlock.count({
        where: {
          recruiterId: session.user.id,
          source: "talent_pool",
          unlockedAt: { gte: periodStart },
        },
      });
      if (usedQuota >= quota) {
        return { type: "quota_exhausted" as const };
      }
    }
    await tx.engineerUnlock.create({
      data: {
        recruiterId: session.user.id,
        engineerId: params.id,
        source: "talent_pool",
      },
    });
    return { type: "ok" as const };
  });

  if (unlockResult.type === "quota_exhausted") {
    return NextResponse.json(
      { code: "QUOTA_EXHAUSTED", resetAt },
      { status: 429 },
    );
  }

  // 6. Fire-and-forget unlock notification email
  const companyName =
    recruiter?.recruiterProfile?.companyName ?? "A recruiter";
  sendUnlockNotificationEmail({
    engineerEmail: engineer.email ?? "",
    engineerName: engineer.name ?? "Engineer",
    companyName,
    source: "talent_pool",
  }).catch(() => {
    /* non-critical */
  });

  return NextResponse.json({
    data: {
      alreadyUnlocked: false,
      fullName: engineer.name ?? "",
      email: engineer.email ?? "",
      githubUrl: engineer.seekerProfile?.githubUrl ?? null,
      linkedinUrl: engineer.seekerProfile?.linkedinUrl ?? null,
      resumeUrl: engineer.seekerProfile?.resumeKey
        ? resolveLogoUrl(engineer.seekerProfile.resumeKey)
        : null,
    },
  });
}
