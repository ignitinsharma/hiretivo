"use server";

import { auth, unstable_update } from "@/auth";
import { SkillLevel, UserRole, VerificationStatus } from "@/constants/enums";
import {
  mergeOnboardingDraft,
  nextProgressStep,
} from "@/lib/onboarding/progress";
import { prisma } from "@/lib/prisma";
import { invalidateSeekerCache } from "@/lib/match";
import { uploadFile } from "@/lib/r2";
import { sendEmail } from "@/lib/resend";
import { getAppUrl } from "@/lib/config";
import {
  step1Schema,
  step4Schema,
} from "@/lib/validations/onboarding.schema";
import { uniqueCanonicalSkillNames } from "@/lib/skills/canonicalize";
import { resolveSkillNames } from "@/lib/skills/resolve-skill-names";
import {
  projectEntrySchema,
  workExperienceEntrySchema,
  extractGithubUsername,
} from "@/lib/validations/seeker-onboarding.schema";
import { isValidState, isValidCity, formatLocation, isCanonicalLocation } from "@/modules/india-location";
import type { IndiaState } from "@/modules/india-location";
import { ParsedResumeSchema } from "@/lib/validations/resume-parse.schema";
import type { ParsedResumeDraft } from "@/lib/validations/resume-parse.schema";
import { z } from "zod";

type ActionResult = { success: true } | { success: false; error: string };
type MissingSeekerOnboardingStep = 1 | 2 | 3 | 4 | 5;
type CompleteSeekerOnboardingResult =
  | { success: true; redirectTo: "/seeker/dashboard" }
  | { success: false; error: string; missingStep: MissingSeekerOnboardingStep };

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Hiretivo <noreply@hiretivo.com>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@hiretivo.com";

const YEARS_EXPERIENCE_MAP: Record<string, number> = {
  "<1": 0,
  UNDER_1: 0,
  LESS_THAN_1: 0,
  "1_TO_3": 2,
  "3_TO_5": 4,
  "5_TO_10": 7,
  MORE_THAN_10: 10,
};

/*
 * mapYearsOfExperience
 * Converts onboarding range selections into the numeric profile field.
 */
function mapYearsOfExperience(value: string | null): number | null {
  if (!value) return null;
  return YEARS_EXPERIENCE_MAP[value] ?? null;
}

/*
 * saveStep1
 * Persists step 1 data: situation (to SeekerProfile), experienceLevel (to draft),
 * and canonical India location (to SeekerProfile.location) in a single transaction.
 * Validates city (no commas, 2-100 chars) and state (must be valid Indian State/UT).
 */
export async function saveStep1(data: {
  situation: string;
  experienceLevel: string;
  city: string;
  state: string;
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

  if (!isValidCity(data.city)) {
    return { success: false, error: "City must be 2–100 characters and cannot contain commas." };
  }
  if (!isValidState(data.state)) {
    return { success: false, error: "Please select a valid Indian State or Union Territory." };
  }

  const location = formatLocation(data.city, data.state as IndiaState);

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
        location,
      },
      update: {
        situation: parsed.data.situation,
        location,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: nextProgressStep(user?.onboardingStep, 2),
        onboardingDraft: mergeOnboardingDraft(user?.onboardingDraft, {
          seeker: { experienceLevel: parsed.data.experienceLevel },
        }),
      },
    }),
  ]);

  return { success: true };
}

// --- Step 2: Primary Role + Years + Skills ---
export async function saveStep2(data: {
  primaryRole: string;
  yearsOfExperience: string | null;
  skills: string[];
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = z
    .object({
      primaryRole: z
        .string()
        .trim()
        .min(1, "Primary role is required")
        .max(100, "Primary role must be under 100 characters"),
      yearsOfExperience: z.string().nullable(),
      skills: z
        .array(z.string().trim().min(1).max(100))
        .min(1, "At least one skill is required"),
    })
    .safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  const skillNames = uniqueCanonicalSkillNames(parsed.data.skills);
  if (skillNames.length === 0) {
    return { success: false, error: "At least one skill is required" };
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
        yearsExperience: mapYearsOfExperience(parsed.data.yearsOfExperience),
      },
      update: {
        primaryRole: parsed.data.primaryRole,
        yearsExperience: mapYearsOfExperience(parsed.data.yearsOfExperience),
      },
      select: { id: true },
    });

    await tx.seekerSkill.deleteMany({
      where: { seekerProfileId: profile.id },
    });

    const resolvedSkills = await resolveSkillNames(tx, skillNames);
    await tx.seekerSkill.createMany({
      data: resolvedSkills.map((skill) => ({
        seekerProfileId: profile.id,
        skillId: skill.id,
        level: SkillLevel.INTERMEDIATE,
      })),
      skipDuplicates: true,
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: nextProgressStep(user?.onboardingStep, 3),
        onboardingDraft: mergeOnboardingDraft(user?.onboardingDraft, {
          seeker: { yearsOfExperience: parsed.data.yearsOfExperience },
        }),
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

// --- Step 4 (new flow): Step 4: Job Preferences ---
export async function saveStep4(data: {
  jobType: string | null;
  category: string | null;
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, onboardingDraft: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingStep: nextProgressStep(user?.onboardingStep, 5),
      onboardingDraft: mergeOnboardingDraft(user?.onboardingDraft, {
        seeker: {
          jobType: data.jobType,
          category: data.category,
        },
      }),
    },
  });

  return { success: true };
}

/*
 * saveProofOfWork
 * Step 3 (6-step flow): saves GitHub URL, required social/video links, and project entries.
 * Derives githubUsername from the provided URL.
 * Advances onboardingStep to 4.
 * @returns ActionResult
 */
export async function saveProofOfWork(data: {
  githubUrl: string;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string;
  videoIntroUrl: string | null;
  projects: Array<{ title: string; url: string; description: string }>;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  // Validate with Zod — httpUrl blocks javascript:/data: XSS vectors
  const httpUrl = z.string().url().refine((u) => {
    try { const { protocol } = new URL(u); return protocol === 'https:' || protocol === 'http:'; }
    catch { return false; }
  }, 'Only http(s) URLs are allowed');

  const schema = z.object({
    githubUrl: httpUrl.refine((u) => /github\.com\/[a-zA-Z0-9_-]+/.test(u), "Please enter a valid GitHub profile URL"),
    linkedinUrl: httpUrl.or(z.literal("")).nullable().optional(),
    twitterUrl: httpUrl.or(z.literal("")).nullable().optional(),
    websiteUrl: httpUrl,
    // videoIntroUrl is optional — accept a valid http(s) URL or an empty string
    videoIntroUrl: httpUrl.or(z.literal("")).nullable().optional(),
    projects: projectEntrySchema.array().min(1, "At least one project is required"),
  });

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const githubUsername = extractGithubUsername(parsed.data.githubUrl);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true },
  });

  await prisma.$transaction([
    prisma.seekerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        githubUrl: parsed.data.githubUrl,
        githubUsername: githubUsername ?? null,
        linkedinUrl: parsed.data.linkedinUrl || null,
        twitterUrl: parsed.data.twitterUrl || null,
        websiteUrl: parsed.data.websiteUrl,
        videoIntroUrl: parsed.data.videoIntroUrl || null,
        topProjects: parsed.data.projects,
      },
      update: {
        githubUrl: parsed.data.githubUrl,
        githubUsername: githubUsername ?? null,
        linkedinUrl: parsed.data.linkedinUrl || null,
        twitterUrl: parsed.data.twitterUrl || null,
        websiteUrl: parsed.data.websiteUrl,
        videoIntroUrl: parsed.data.videoIntroUrl || null,
        topProjects: parsed.data.projects,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStep: nextProgressStep(user?.onboardingStep, 4),
      },
    }),
  ]);

  return { success: true };
}

/*
 * saveExperience
 * Step 4 (6-step flow): saves work experience entries (required) and education entries (required, min 1).
 * Replaces all existing WorkExperience and Education rows for this seeker profile within a transaction.
 * Advances onboardingStep to 5.
 * @returns ActionResult
 */
export async function saveExperience(data: {
  workExperiences: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
    description?: string | null;
  }>;
  educations: Array<{
    institution: string;
    graduationDate?: string | null;
    degree?: string | null;
    major?: string | null;
  }>;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  // Validate: at least 1 work experience
  const schema = z.object({
    workExperiences: workExperienceEntrySchema.array().min(1, "At least one work experience is required"),
    educations: z
      .object({
        institution: z.string().trim().min(1, "Institution is required"),
        graduationDate: z.string().trim().nullable().optional(),
        degree: z.string().trim().nullable().optional(),
        major: z.string().trim().nullable().optional(),
      })
      .array()
      .min(1, "At least one education entry is required"),
  });

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true },
    });

    // Upsert SeekerProfile to get its id
    const profile = await tx.seekerProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });

    // Replace all work experiences
    await tx.workExperience.deleteMany({
      where: { seekerProfileId: profile.id },
    });

    await tx.workExperience.createMany({
      data: parsed.data.workExperiences.map((exp) => ({
        seekerProfileId: profile.id,
        company: exp.company,
        title: exp.title,
        startDate: exp.startDate,
        endDate: exp.endDate ?? null,
        isCurrent: exp.isCurrent,
        description: exp.description ?? null,
      })),
    });

    // Replace all educations.
    await tx.education.deleteMany({
      where: { seekerProfileId: profile.id },
    });

    if (parsed.data.educations.length > 0) {
      await tx.education.createMany({
        data: parsed.data.educations.map((edu) => ({
          seekerProfileId: profile.id,
          institution: edu.institution,
          graduationDate: edu.graduationDate ?? null,
          degree: edu.degree ?? null,
          major: edu.major ?? null,
        })),
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        onboardingStep: nextProgressStep(user?.onboardingStep, 5),
      },
    });
  });

  return { success: true };
}

/*
 * saveCompensation
 * Step 5 (6-step flow): saves professional headline, bio, salary range, availability,
 * contract type, and optional resume upload.
 * Accepts FormData so the File object is transferred correctly across the server action boundary.
 * Advances onboardingStep to 6.
 * @returns ActionResult
 */
export async function saveCompensation(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  // Extract fields from FormData
  const headline = (formData.get("headline") as string | null)?.trim() ?? "";
  const bio = (formData.get("bio") as string | null)?.trim() ?? "";
  const salaryMinRaw = formData.get("salaryMin") as string | null;
  const salaryMaxRaw = formData.get("salaryMax") as string | null;
  const availability = (formData.get("availability") as string | null) || null;
  const workPreferenceRaw = (formData.get("workPreference") as string | null) || null;
  const VALID_WORK_TYPES = ["REMOTE", "HYBRID", "ONSITE"] as const;
  type ValidWorkType = typeof VALID_WORK_TYPES[number];
  const workPreference: ValidWorkType | null = VALID_WORK_TYPES.includes(workPreferenceRaw as ValidWorkType)
    ? (workPreferenceRaw as ValidWorkType)
    : null;

  const salaryMin = salaryMinRaw ? parseInt(salaryMinRaw, 10) : null;
  const salaryMax = salaryMaxRaw ? parseInt(salaryMaxRaw, 10) : null;

  // Server-side validation
  if (!headline) return { success: false, error: "Professional headline is required" };
  if (!bio) return { success: false, error: "Bio is required" };
  if (salaryMin === null || isNaN(salaryMin)) {
    return { success: false, error: "Minimum salary is required" };
  }
  if (salaryMax === null || isNaN(salaryMax)) {
    return { success: false, error: "Maximum salary is required" };
  }
  if (salaryMin > salaryMax) {
    return { success: false, error: "Minimum salary cannot exceed maximum salary" };
  }

  // Resume upload — same pattern as saveStep3
  const resumeFile = formData.get("resumeFile") as File | null;
  let resumeKey: string | null = null;

  if (resumeFile && resumeFile.size > 0) {
    const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
    if (resumeFile.size > MAX_RESUME_SIZE) {
      return { success: false, error: "Resume must be under 5MB" };
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(resumeFile.type)) {
      return { success: false, error: "Only PDF and DOCX files are allowed" };
    }

    try {
      const ext =
        resumeFile.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? "docx"
          : "pdf";
      const key = `resumes/${session.user.id}/resume.${ext}`;
      await uploadFile(resumeFile, key);
      resumeKey = key;
    } catch (err) {
      console.error("[saveCompensation] R2 upload failed:", err);
      return { success: false, error: "Resume upload failed. Please try again." };
    }
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingStep: true },
  });

  const existingProfile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: { resumeKey: true },
  });

  if (!resumeKey && !existingProfile?.resumeKey) {
    return { success: false, error: "Resume is required" };
  }

  await prisma.seekerProfile.upsert({
    where: { userId },
    create: {
      userId,
      headline,
      bio,
      salaryMin,
      salaryMax,
      currency: "USD",
      salaryMinUsd: salaryMin,
      salaryMaxUsd: salaryMax,
      availability,
      workPreference: workPreference ?? null,
      ...(resumeKey ? { resumeKey } : {}),
    },
    update: {
      headline,
      bio,
      salaryMin,
      salaryMax,
      currency: "USD",
      salaryMinUsd: salaryMin,
      salaryMaxUsd: salaryMax,
      availability,
      workPreference: workPreference ?? null,
      ...(resumeKey ? { resumeKey } : {}),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStep: nextProgressStep(user?.onboardingStep, 6),
    },
  });

  return { success: true };
}

/*
 * completeSeekerOnboarding
 * Validates all mandatory onboarding fields across all 5 steps, then marks the user
 * as onboardingCompleted and sets verificationStatus to PENDING.
 * Fires an admin notification email (fire-and-forget, non-fatal).
 * Returns missingStep if any required step is incomplete.
 * @returns CompleteSeekerOnboardingResult
 */
export async function completeSeekerOnboarding(): Promise<CompleteSeekerOnboardingResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated", missingStep: 1 };
  }
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden", missingStep: 1 };
  }

  const userId = session.user.id;

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: {
      situation: true,
      location: true,
      primaryRole: true,
      availability: true,
      githubUrl: true,
      linkedinUrl: true,
      twitterUrl: true,
      websiteUrl: true,
      videoIntroUrl: true,
      topProjects: true,
      resumeKey: true,
      headline: true,
      bio: true,
      salaryMinUsd: true,
      verificationNotes: true,
      _count: {
        select: {
          skills: true,
          workExperiences: true,
          educations: true,
        },
      },
    },
  });

  // Step 1: situation
  if (!profile?.situation) {
    return {
      success: false,
      error: "Complete your current situation first.",
      missingStep: 1,
    };
  }

  // Step 1 continued: canonical India location required
  if (!isCanonicalLocation(profile.location)) {
    return {
      success: false,
      error: "Please provide your city and state before submitting.",
      missingStep: 1,
    };
  }

  // Step 2: primary role + at least 1 skill
  if (!profile.primaryRole || profile._count.skills === 0) {
    return {
      success: false,
      error: "Add your primary role and at least one skill first.",
      missingStep: 2,
    };
  }

  // Step 3: GitHub URL + at least 1 project
  const projects = profile.topProjects as unknown as Array<unknown> | null;
  if (!profile.githubUrl || !projects || projects.length === 0) {
    return {
      success: false,
      error: "Add your GitHub profile and at least one project first.",
      missingStep: 3,
    };
  }

  // Step 3 continued: portfolio is required; LinkedIn, X/Twitter, and video are optional.
  if (!profile.websiteUrl) {
    return { success: false, error: "Add your portfolio first.", missingStep: 3 };
  }

  // Step 4: at least 1 work experience
  if (profile._count.workExperiences === 0) {
    return {
      success: false,
      error: "Add at least one work experience first.",
      missingStep: 4,
    };
  }

  // Step 4 continued: at least 1 education entry required
  if (profile._count.educations === 0) {
    return { success: false, error: "Add at least one education entry first.", missingStep: 4 };
  }

  // Step 5: resume, headline, bio, availability, salaryMinUsd
  if (
    !profile.resumeKey ||
    !profile.headline ||
    !profile.bio ||
    !profile.availability ||
    profile.salaryMinUsd === null ||
    profile.salaryMinUsd === undefined
  ) {
    return {
      success: false,
      error: "Complete your compensation and profile details first.",
      missingStep: 5,
    };
  }

  // All checks passed — mark as submitted for review
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationStatus: VerificationStatus.PENDING,
      onboardingCompleted: true,
      onboardingStep: null,
    },
  });

  await prisma.seekerProfile.update({
    where: { userId },
    data: { submittedForReviewAt: new Date() },
  });

  await unstable_update({
    user: { onboardingCompleted: true, onboardingStep: null },
  });

  // Fire admin notification — fire-and-forget, non-fatal
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  sendAdminNotification({
    userName: user?.name ?? "Unknown",
    userEmail: user?.email ?? "",
    profileUrl: `${getAppUrl()}/admin/verification/${userId}`,
  }).catch((err) => {
    console.error("[completeSeekerOnboarding] Admin notification failed (non-fatal):", err);
  });

  return { success: true, redirectTo: "/seeker/dashboard" };
}

/*
 * saveParsedProfile
 * Persists the seeker-reviewed draft from the progressive onboarding flow
 * (Phase 1c): headline, bio, primaryRole, location, skills, work experiences,
 * and educations. Re-validates server-side (the client already validated with
 * the same schema — this is the trust boundary). Completes onboarding directly
 * with NO review wall — the pivot has no verification step, seekers browse
 * immediately after saving. Does not set verificationStatus.
 * @param input - { draft: reviewed ParsedResumeDraft, resumeKey: R2 key or null }
 * @returns ActionResult
 */
export async function saveParsedProfile(input: {
  draft: ParsedResumeDraft;
  resumeKey: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== UserRole.SEEKER) {
    return { success: false, error: "Forbidden" };
  }

  const parsed = ParsedResumeSchema.safeParse(input.draft);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: " + parsed.error.issues[0]?.message };
  }

  const userId = session.user.id;
  const skillNames = uniqueCanonicalSkillNames(parsed.data.skills);

  // Only trust a resumeKey that lives under this user's own R2 namespace — the
  // client echoes back whatever parse-resume returned, so without this check a
  // crafted request could point another user's profile at an arbitrary R2 key.
  const isOwnResumeKey =
    input.resumeKey !== null && input.resumeKey.startsWith(`resumes/${userId}/`);
  const resumeKey = isOwnResumeKey ? input.resumeKey : null;

  await prisma.$transaction(async (tx) => {
    const profile = await tx.seekerProfile.upsert({
      where: { userId },
      create: {
        userId,
        headline: parsed.data.headline || null,
        bio: parsed.data.bio || null,
        primaryRole: parsed.data.primaryRole || null,
        location: parsed.data.location || null,
        ...(resumeKey ? { resumeKey } : {}),
      },
      update: {
        headline: parsed.data.headline || null,
        bio: parsed.data.bio || null,
        primaryRole: parsed.data.primaryRole || null,
        location: parsed.data.location || null,
        ...(resumeKey ? { resumeKey } : {}),
      },
      select: { id: true },
    });

    if (skillNames.length > 0) {
      await tx.seekerSkill.deleteMany({ where: { seekerProfileId: profile.id } });
      const resolvedSkills = await resolveSkillNames(tx, skillNames);
      await tx.seekerSkill.createMany({
        data: resolvedSkills.map((skill) => ({
          seekerProfileId: profile.id,
          skillId: skill.id,
          level: SkillLevel.INTERMEDIATE,
        })),
        skipDuplicates: true,
      });
    }

    await tx.workExperience.deleteMany({ where: { seekerProfileId: profile.id } });
    if (parsed.data.workExperiences.length > 0) {
      await tx.workExperience.createMany({
        data: parsed.data.workExperiences.map((exp) => ({
          seekerProfileId: profile.id,
          company: exp.company,
          title: exp.title,
          startDate: exp.startDate,
          endDate: exp.endDate ?? null,
          isCurrent: exp.isCurrent,
          description: exp.description ?? null,
        })),
      });
    }

    await tx.education.deleteMany({ where: { seekerProfileId: profile.id } });
    if (parsed.data.educations.length > 0) {
      await tx.education.createMany({
        data: parsed.data.educations.map((edu) => ({
          seekerProfileId: profile.id,
          institution: edu.institution,
          graduationDate: edu.graduationDate ?? null,
          degree: edu.degree ?? null,
          major: edu.major ?? null,
        })),
      });
    }

    // No verificationStatus — pivot has no review wall, seeker browses immediately.
    await tx.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true, onboardingStep: null },
    });
  });

  await unstable_update({
    user: { onboardingCompleted: true, onboardingStep: null },
  });

  const seekerProfile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (seekerProfile) {
    invalidateSeekerCache(seekerProfile.id).catch((err) => {
      console.error("[saveParsedProfile] Cache invalidation failed (non-fatal):", err);
    });
  }

  return { success: true };
}

/*
 * sendAdminNotification
 * Sends an internal notification email to admin when a new engineer submits for review.
 * Fire-and-forget — never call with await in the main flow.
 */
async function sendAdminNotification(opts: {
  userName: string;
  userEmail: string;
  profileUrl: string;
}): Promise<void> {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const safeName = esc(opts.userName);
  const safeEmail = esc(opts.userEmail);
  // profileUrl is admin-internal (cuid-based path, not user-controlled text) — safe to use as href
  await sendEmail({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New engineer submitted for review: ${safeName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Verification Submission</h2>
        <p><strong>${safeName}</strong> (${safeEmail}) has submitted their profile for verification.</p>
        <p>
          <a href="${opts.profileUrl}" style="display:inline-block;padding:12px 24px;background:#7560ff;color:white;border-radius:8px;text-decoration:none;font-weight:600;">
            Review Profile
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px;">Profile URL: ${opts.profileUrl}</p>
      </div>
    `,
    text: `New verification submission from ${opts.userName} (${opts.userEmail}).\n\nReview at: ${opts.profileUrl}`,
  });
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
