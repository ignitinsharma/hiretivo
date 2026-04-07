"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WorkType } from "@/constants/enums";
import { invalidateSeekerCache } from "@/lib/match";
import { uploadFile, R2_KEYS } from "@/lib/r2";

type ActionResult = { success: true } | { success: false; error: string };

// --- Step 1: Situation ---
// experienceLevel is not a DB column on SeekerProfile; situation is the only Step 1 field
// persisted to DB. Per D-05, the schema has: situation, primaryRole, salaryMin, salaryMax,
// currency, availability. experienceLevel informs the UI wizard but is not stored separately.
export async function saveStep1(data: {
  situation: string;
  experienceLevel: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  await prisma.seekerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      situation: data.situation,
    },
    update: {
      situation: data.situation,
    },
  });

  return { success: true };
}

// --- Step 2: Primary Role + Years + Skills ---
// Skills are stored as SeekerSkill records (D-11).
export async function saveStep2(data: {
  primaryRole: string;
  yearsOfExperience: string | null;
  skills: { skillId: string; level: string }[];
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  await prisma.$transaction(async (tx) => {
    const profile = await tx.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, primaryRole: data.primaryRole },
      update: { primaryRole: data.primaryRole },
      select: { id: true },
    });

    await tx.seekerSkill.deleteMany({
      where: { seekerProfileId: profile.id },
    });

    if (data.skills.length > 0) {
      await tx.seekerSkill.createMany({
        data: data.skills.map((s) => ({
          seekerProfileId: profile.id,
          skillId: s.skillId,
          level: (s.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT') ?? 'INTERMEDIATE',
        })),
      });
    }
  });

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (seekerProfile) {
    await invalidateSeekerCache(seekerProfile.id);
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
    const ext = resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'docx' : 'pdf';
    const key = `resumes/${session.user.id}/resume.${ext}`;
    await uploadFile(resumeFile, key);
    resumeKey = key;
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

function isWorkType(value: string | null): value is WorkType {
  return (
    value === WorkType.REMOTE ||
    value === WorkType.HYBRID ||
    value === WorkType.ONSITE
  );
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

  // workPreference must be a valid WorkType enum value or null for the DB field.
  // Values come from the seeker onboarding UI which only emits valid WorkType strings.
  const workPreference = isWorkType(data.workPreference)
    ? data.workPreference
    : null;

  await prisma.seekerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      currency: data.currency,
      availability: data.availability,
      workPreference,
    },
    update: {
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      currency: data.currency,
      availability: data.availability,
      workPreference,
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
