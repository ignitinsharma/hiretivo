"use server";

import { auth, unstable_update } from "@/auth";
import { UserRole } from "@/constants/enums";
import {
  mergeOnboardingDraft,
  nextProgressStep,
} from "@/lib/onboarding/progress";
import { prisma } from "@/lib/prisma";
import { invalidateSeekerCache } from "@/lib/match";
import { uploadFile } from "@/lib/r2";
import { step1Schema, step2Schema, step4Schema } from "@/lib/validations/onboarding.schema";

type ActionResult = { success: true } | { success: false; error: string };
type MissingSeekerOnboardingStep = 1 | 2 | 4;
type CompleteSeekerOnboardingResult =
  | { success: true; redirectTo: "/seeker/settings" }
  | { success: false; error: string; missingStep: MissingSeekerOnboardingStep };

// --- Step 1: Situation ---
export async function saveStep1(data: {
  situation: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = step1Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, onboardingDraft: true },
  });

  await prisma.$transaction([
    prisma.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        situation: parsed.data.situation,
      },
      update: {
        situation: parsed.data.situation,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: nextProgressStep(user?.onboardingStep, 2),
      },
    }),
  ]);

  return { success: true };
}

// --- Step 2: Primary Role + Years + Skills ---
export async function saveStep2(data: {
  primaryRole: string;
  yearsOfExperience: number | null;
  skills: { skillId: string; level: string }[];
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = step2Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingStep: true, onboardingDraft: true },
    });

    const profile = await tx.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        primaryRole: parsed.data.primaryRole,
        yearsExperience: parsed.data.yearsOfExperience,
      },
      update: {
        primaryRole: parsed.data.primaryRole,
        yearsExperience: parsed.data.yearsOfExperience,
      },
      select: { id: true },
    });

    await tx.seekerSkill.deleteMany({
      where: { seekerProfileId: profile.id },
    });

    if (parsed.data.skills.length > 0) {
      await tx.seekerSkill.createMany({
        data: parsed.data.skills.map((s) => ({
          seekerProfileId: profile.id,
          skillId: s.skillId,
          level: s.level,
        })),
      });
    }

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: nextProgressStep(user?.onboardingStep, 3),
      },
    });
  });

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (seekerProfile) {
    // Fire-and-forget: cache invalidation must not block or fail the save.
    // If Redis is unconfigured or the match computation fails, onboarding
    // still completes — matches will recompute on the next cron run.
    invalidateSeekerCache(seekerProfile.id).catch((err) => {
      console.error("[saveStep2] Cache invalidation failed (non-fatal):", err);
    });
  }

  return { success: true };
}

// --- Step 3: Resume (upload to R2, store key in DB) ---
// Step 3 is skippable so null values are valid.
// Accepts FormData so the File object is transferred correctly across
// the server action boundary (plain object props cannot carry File).
export async function saveStep3(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  const resumeFile = formData.get('resumeFile') as File | null;
  let resumeKey: string | null = null;

  if (resumeFile && resumeFile.size > 0) {
    // Security fix: Validate file size (max 5MB)
    const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
    if (resumeFile.size > MAX_RESUME_SIZE) {
      return { success: false, error: "Resume must be under 5MB" };
    }

    // Security fix: Validate file type (only PDF and DOCX allowed)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      return { success: false, error: "Only PDF and DOCX files are allowed" };
    }

    try {
      const ext = resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'docx' : 'pdf';
      const key = `resumes/${session.user.id}/resume.${ext}`;
      await uploadFile(resumeFile, key);
      resumeKey = key;
    } catch (err) {
      console.error("[saveStep3] R2 upload failed:", err);
      return { success: false, error: "Resume upload failed. Please try again or skip this step." };
    }
  }

  const existingProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { resumeKey: true },
  });

  if (resumeKey) {
    await prisma.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        resumeKey,
      },
      update: {
        resumeKey,
      },
    });
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
        seeker: { resumeSkipped: !resumeKey && !existingProfile?.resumeKey },
      }),
    },
  });

  return { success: true };
}

export async function skipSeekerResumeOnboarding(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }
  if (session.user.role !== UserRole.SEEKER) {
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
        seeker: { resumeSkipped: true },
      }),
    },
  });

  return { success: true };
}

// --- Step 4: Salary, timezone, and availability ---
export async function saveStep4(data: {
  targetSalaryMin: number;
  targetSalaryMax: number;
  timezoneOverlapHours: number;
  availableFrom: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = step4Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  const availableFromDate = new Date(parsed.data.availableFrom);
  if (Number.isNaN(availableFromDate.getTime())) {
    return { success: false, error: "Invalid date for availableFrom" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true },
  });

  await prisma.$transaction([
    prisma.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        salaryMinUsd: parsed.data.targetSalaryMin,
        salaryMaxUsd: parsed.data.targetSalaryMax,
      },
      update: {
        salaryMinUsd: parsed.data.targetSalaryMin,
        salaryMaxUsd: parsed.data.targetSalaryMax,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        timezoneOverlapHours: parsed.data.timezoneOverlapHours,
        availableFrom: availableFromDate,
        onboardingStep: nextProgressStep(user?.onboardingStep, 5),
      },
    }),
  ]);

  return { success: true };
}

export async function completeSeekerOnboarding(): Promise<CompleteSeekerOnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", missingStep: 1 };
  }
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden", missingStep: 1 };
  }

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      situation: true,
      primaryRole: true,
      salaryMinUsd: true,
      _count: { select: { skills: true } },
    },
  });

  if (!profile?.situation) {
    return {
      success: false,
      error: "Complete your current situation first.",
      missingStep: 1,
    };
  }

  if (!profile.primaryRole || profile._count.skills === 0) {
    return {
      success: false,
      error: "Add your primary role and at least one skill first.",
      missingStep: 2,
    };
  }

  if (!profile.salaryMinUsd) {
    return {
      success: false,
      error: "Complete salary preferences first.",
      missingStep: 4,
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true, onboardingStep: null },
  });
  await unstable_update({
    user: { onboardingCompleted: true, onboardingStep: null },
  });

  return { success: true, redirectTo: "/seeker/settings" };
}

// --- Profile Completeness (per D-09: computed on read, not stored) ---
export async function computeProfileCompleteness(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      timezoneOverlapHours: true,
      seekerProfile: {
        select: {
          situation: true,
          primaryRole: true,
          bio: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          _count: { select: { skills: true } },
        },
      },
    },
  });

  const profile = user?.seekerProfile;
  if (!profile) return 0;

  // 7 tracked fields across steps 1–4
  const fields = [
    profile.situation,
    profile.primaryRole,
    profile._count.skills > 0 ? 'has_skills' : null,
    profile.bio,
    profile.salaryMinUsd,
    profile.salaryMaxUsd,
    user.timezoneOverlapHours,
  ];

  const filled = fields.filter((f) => f !== null && f !== undefined && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}
