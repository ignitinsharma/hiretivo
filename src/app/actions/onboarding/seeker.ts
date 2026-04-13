"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { invalidateSeekerCache } from "@/lib/match";
import { uploadFile } from "@/lib/r2";
import { step1Schema, step2Schema, step4Schema } from "@/lib/validations/onboarding.schema";

type ActionResult = { success: true } | { success: false; error: string };

// --- Step 1: Situation ---
export async function saveStep1(data: {
  situation: string;
  experienceLevel: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const parsed = step1Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  await prisma.seekerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      situation: parsed.data.situation,
    },
    update: {
      situation: parsed.data.situation,
    },
  });

  return { success: true };
}

// --- Step 2: Primary Role + Years + Skills ---
export async function saveStep2(data: {
  primaryRole: string;
  yearsOfExperience: string | null;
  skills: { skillId: string; level: string }[];
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const parsed = step2Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  await prisma.$transaction(async (tx) => {
    const profile = await tx.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, primaryRole: parsed.data.primaryRole },
      update: { primaryRole: parsed.data.primaryRole },
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

  return { success: true };
}

// --- Step 4: Job Preferences ---
export async function saveStep4(data: {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  availability: string | null;
  workPreference: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const parsed = step4Schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  await prisma.seekerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      salaryMin: parsed.data.salaryMin,
      salaryMax: parsed.data.salaryMax,
      currency: parsed.data.currency,
      availability: parsed.data.availability,
      workPreference: parsed.data.workPreference,
    },
    update: {
      salaryMin: parsed.data.salaryMin,
      salaryMax: parsed.data.salaryMax,
      currency: parsed.data.currency,
      availability: parsed.data.availability,
      workPreference: parsed.data.workPreference,
    },
  });

  return { success: true };
}

// --- Profile Completeness (per D-09: computed on read, not stored) ---
export async function computeProfileCompleteness(userId: string): Promise<number> {
  const profile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: {
      situation: true,
      primaryRole: true,
      bio: true,
      salaryMin: true,
      salaryMax: true,
      availability: true,
      _count: { select: { skills: true } },
    },
  });

  if (!profile) return 0;

  // 7 tracked fields across steps 1–4
  const fields = [
    profile.situation,
    profile.primaryRole,
    profile._count.skills > 0 ? 'has_skills' : null,
    profile.bio,
    profile.salaryMin,
    profile.salaryMax,
    profile.availability,
  ];

  const filled = fields.filter((f) => f !== null && f !== undefined && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}
