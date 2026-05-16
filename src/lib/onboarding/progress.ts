import { Prisma } from "@prisma/client";

export type SeekerOnboardingStep = 1 | 2 | 3 | 4 | 5;
export type RecruiterOnboardingStep = 1 | 2 | 3 | 4;

export interface SeekerOnboardingDraft {
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
  salaryMinUsd: number | null;
  skillsCount: number;
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
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
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
  if (!profile?.situation) return 1;
  if (!profile.primaryRole || profile.skillsCount === 0) return 2;

  if (isSeekerStep(storedStep)) {
    if (storedStep === 5 && !profile.salaryMinUsd) return 4;
    return storedStep;
  }

  return profile.salaryMinUsd ? 5 : 4;
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
