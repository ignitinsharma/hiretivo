import { Prisma } from "@prisma/client";

export type SeekerOnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;
export type RecruiterOnboardingStep = 1 | 2 | 3 | 4;

export interface SeekerOnboardingDraft {
  experienceLevel?: string | null;
  yearsOfExperience?: string | null;
  jobType?: string | null;
  category?: string | null;
  resumeSkipped?: boolean;
}

export interface RecruiterOnboardingDraft {
  role?: string | null;
  hiringScale?: string | null;
  jobSkipped?: boolean;
}

export interface OnboardingDraft {
  seeker?: SeekerOnboardingDraft;
  recruiter?: RecruiterOnboardingDraft;
}

export interface SeekerProgressProfile {
  situation: string | null;
  primaryRole: string | null;
  availability: string | null;
  skillsCount: number;
  githubUrl?: string | null;
  hasProjects?: boolean;
  workExperiencesCount?: number;
  resumeKey?: string | null;
  headline?: string | null;
}

export interface RecruiterProgressProfile {
  hasCompanyProfile: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asNullableString(value: unknown): string | null | undefined {
  if (typeof value === "string") return value;
  if (value === null) return null;
  return undefined;
}

function stripUndefined<T extends Record<string, unknown>>(
  value: T,
): Record<string, Prisma.InputJsonValue> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Record<string, Prisma.InputJsonValue>;
}

export function parseOnboardingDraft(
  value: Prisma.JsonValue | null | undefined,
): OnboardingDraft {
  if (!isRecord(value)) return {};

  const draft: OnboardingDraft = {};

  if (isRecord(value.seeker)) {
    draft.seeker = {
      experienceLevel: asNullableString(value.seeker.experienceLevel),
      yearsOfExperience: asNullableString(value.seeker.yearsOfExperience),
      jobType: asNullableString(value.seeker.jobType),
      category: asNullableString(value.seeker.category),
      resumeSkipped:
        typeof value.seeker.resumeSkipped === "boolean"
          ? value.seeker.resumeSkipped
          : undefined,
    };
  }

  if (isRecord(value.recruiter)) {
    draft.recruiter = {
      role: asNullableString(value.recruiter.role),
      hiringScale: asNullableString(value.recruiter.hiringScale),
      jobSkipped:
        typeof value.recruiter.jobSkipped === "boolean"
          ? value.recruiter.jobSkipped
          : undefined,
    };
  }

  return draft;
}

export function mergeOnboardingDraft(
  current: Prisma.JsonValue | null | undefined,
  patch: OnboardingDraft,
): Prisma.InputJsonValue {
  const existing = parseOnboardingDraft(current);
  return {
    seeker: stripUndefined({
      ...(existing.seeker ?? {}),
      ...(patch.seeker ?? {}),
    }),
    recruiter: stripUndefined({
      ...(existing.recruiter ?? {}),
      ...(patch.recruiter ?? {}),
    }),
  };
}

export function nextProgressStep(
  currentStep: number | null | undefined,
  nextStep: number,
): number {
  return Math.max(currentStep ?? 1, nextStep);
}

function isSeekerStep(value: number | null | undefined): value is SeekerOnboardingStep {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6;
}

function isRecruiterStep(
  value: number | null | undefined,
): value is RecruiterOnboardingStep {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

export function resolveSeekerOnboardingStep(
  storedStep: number | null | undefined,
  profile: SeekerProgressProfile | null | undefined,
): SeekerOnboardingStep {
  // Hard gate: step 1 — situation required
  if (!profile?.situation) return 1;

  // Hard gate: step 2 — primary role + at least 1 skill required
  if (!profile.primaryRole || profile.skillsCount === 0) return 2;

  // Hard gate: step 3 — GitHub URL + at least 1 project required
  if (!profile.githubUrl || !profile.hasProjects) return 3;

  // Hard gate: step 4 — at least 1 work experience required
  if ((profile.workExperiencesCount ?? 0) === 0) return 4;

  // Hard gate: step 5 — availability, headline, and resumeKey required
  if (!profile.availability || !profile.headline || !profile.resumeKey) return 5;

  // All steps complete — review step
  if (isSeekerStep(storedStep) && storedStep >= 6) return 6;
  return 6;
}

export function resolveRecruiterOnboardingStep(
  storedStep: number | null | undefined,
  profile: RecruiterProgressProfile | null | undefined,
): RecruiterOnboardingStep {
  if (isRecruiterStep(storedStep)) {
    if (storedStep >= 3 && !profile?.hasCompanyProfile) return 2;
    return storedStep;
  }

  return profile?.hasCompanyProfile ? 3 : 1;
}
