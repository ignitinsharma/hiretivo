"use server";

import { auth, unstable_update } from "@/auth";
import { ApplyType, CurrencyCode, JobStatus, SkillLevel, UserRole } from "@/constants/enums";
import { invalidateJobSkillsCache } from "@/lib/match";
import { resolveSkillNames } from "@/lib/skills/resolve-skill-names";
import { getEmailVerificationStatus } from "@/lib/auth/email-verification";
import {
  mergeOnboardingDraft,
  nextProgressStep,
} from "@/lib/onboarding/progress";
import { prisma } from "@/lib/prisma";
import { recruiterProfileSchema, createJobFromOnboardingSchema } from "@/lib/validations/onboarding.schema";

type ActionResult = { success: true } | { success: false; error: string };

export async function saveRecruiterRole(data: {
  role: string;
  hiringScale: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return { success: false, error: "Forbidden" };
  }

  const role = data.role.trim();
  const hiringScale = data.hiringScale.trim();
  if (!role || !hiringScale) {
    return { success: false, error: "Complete your hiring role first" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, onboardingDraft: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingStep: nextProgressStep(user?.onboardingStep, 2),
      onboardingDraft: mergeOnboardingDraft(user?.onboardingDraft, {
        recruiter: { role, hiringScale },
      }),
    },
  });

  return { success: true };
}

export async function saveRecruiterProfile(data: {
  companyName: string;
  website: string | null;
  companySize: string | null;
  bio?: string | null;
  industry?: string | null;
  fundingType?: string | null;
  isFullyRemote?: boolean;
  logo?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = recruiterProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true },
  });

  await prisma.$transaction([
    prisma.recruiterProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        companyName: parsed.data.companyName,
        website: parsed.data.website ?? null,
        companySize: parsed.data.companySize ?? null,
        bio: parsed.data.bio ?? null,
        industry: parsed.data.industry ?? null,
        fundingType: parsed.data.fundingType ?? null,
        isFullyRemote: parsed.data.isFullyRemote ?? false,
        logo: parsed.data.logo ?? null,
      },
      update: {
        companyName: parsed.data.companyName,
        website: parsed.data.website ?? null,
        companySize: parsed.data.companySize ?? null,
        bio: parsed.data.bio ?? null,
        industry: parsed.data.industry ?? null,
        fundingType: parsed.data.fundingType ?? null,
        isFullyRemote: parsed.data.isFullyRemote ?? false,
        logo: parsed.data.logo ?? null,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStep: nextProgressStep(user?.onboardingStep, 3) },
    }),
  ]);

  return { success: true };
}

// --- Create Job from Onboarding (Step 3) ---
export async function createJobFromOnboarding(data: {
  title: string;
  description: string;
  jobType: string;
  experienceLevel: string | null;
  category: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkills: string[];
}): Promise<ActionResult & { jobId?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = createJobFromOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  try {
    const verificationStatus = await getEmailVerificationStatus(session.user.id);
    const shouldPublish = verificationStatus?.isVerified === true;
    const job = await prisma.$transaction(async (tx) => {
      const created = await tx.job.create({
        data: {
          recruiterId: session.user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          jobType: parsed.data.jobType,
          applyType: ApplyType.INTERNAL,
          status: shouldPublish ? JobStatus.OPEN : JobStatus.DRAFT,
          publishedAt: shouldPublish ? new Date() : null,
          salaryMin: parsed.data.salaryMin,
          salaryMax: parsed.data.salaryMax,
          currency: CurrencyCode.USD,
          experienceLevel: parsed.data.experienceLevel,
          category: parsed.data.category,
        },
      });

      const skills = await resolveSkillNames(tx, parsed.data.requiredSkills);
      await tx.jobSkill.createMany({
        data: skills.map((s) => ({
          jobId: created.id,
          skillId: s.id,
          level: SkillLevel.INTERMEDIATE,
        })),
      });

      return created;
    });

    if (shouldPublish) {
      await invalidateJobSkillsCache(job.id);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStep: 4 },
    });

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error("[createJobFromOnboarding] Failed to create job:", error);
    return { success: false, error: "Failed to create job listing" };
  }
}

export async function skipRecruiterJobOnboarding(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return { success: false, error: "Forbidden" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, onboardingDraft: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingStep: nextProgressStep(user?.onboardingStep, 4),
      onboardingDraft: mergeOnboardingDraft(user?.onboardingDraft, {
        recruiter: { jobSkipped: true },
      }),
    },
  });

  return { success: true };
}

export async function completeRecruiterOnboarding(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  if (session.user.role !== UserRole.RECRUITER) {
    return { success: false, error: "Forbidden" };
  }

  const profile = await prisma.recruiterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) {
    return { success: false, error: "Complete your company profile first" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true, onboardingStep: null },
  });
  await unstable_update({
    user: { onboardingCompleted: true, onboardingStep: null },
  });

  return { success: true };
}
