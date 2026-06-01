import { z } from 'zod';
import { CurrencyCode, OnboardingJobType, SEEKER_CURRENCY_VALUES, SEEKER_ONBOARDING_JOB_TYPE_VALUES } from '@/constants/enums';

export type {
  SeekerSituation,
  ExperienceLevel,
  YearsOfExperience,
  JobType,
  JobCategory,
  Currency,
  Availability,
  SalaryRange,
  ResumeFile,
  Step1Data,
  Step2Data,
  Step3Data,
  Step4Data,
  SeekerOnboardingData,
  SeekerOnboardingStep,
} from '@/modules/seeker-onboarding/types/seeker-onboarding.types';

/*
 * step1Schema
 * Validates seeker situation and experience level in step 1 of onboarding.
 */
export const step1Schema = z.object({
  situation: z.enum(['ACTIVELY_LOOKING', 'OPEN_TO_OFFERS', 'EXPLORING_OPTIONS', 'STUDENT_FRESH_GRAD']).optional(),
  experienceLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR']).optional(),
});

/*
 * salaryRangeSchema
 * Validates salary range with min/max and USD-only currency.
 * Ensures min does not exceed max when both are provided.
 */
export const salaryRangeSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  currency: z.literal(CurrencyCode.USD),
}).refine(
  (data) => {
    if (data.min !== null && data.max !== null) {
      return data.min <= data.max;
    }
    return true;
  },
  { message: 'Minimum salary cannot be greater than maximum salary' }
);

/*
 * step2Schema
 * Validates primary role, years of experience, and skills in step 2.
 */
export const step2Schema = z.object({
  primaryRole: z.string().min(1, 'Primary role is required'),
  yearsOfExperience: z.enum(['LESS_THAN_1', '1_TO_3', '3_TO_5', '5_TO_10', 'MORE_THAN_10']).optional(),
  skills: z.array(z.string()),
});

/*
 * resumeFileSchema
 * Validates uploaded resume file metadata.
 */
export const resumeFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  key: z.string().nullable(),
  url: z.string().nullable(),
});

/*
 * step3SchemaLegacy
 * Legacy step 3 schema (resume upload). Retained for backward compatibility.
 */
export const step3SchemaLegacy = z.object({
  resume: resumeFileSchema.nullable(),
});

/*
 * step4SchemaPreferences
 * Validates job type, category, salary range and availability preferences.
 */
export const step4SchemaPreferences = z.object({
  jobType: z.enum(SEEKER_ONBOARDING_JOB_TYPE_VALUES).optional(),
  category: z.enum(['ENGINEERING', 'DESIGN', 'MARKETING', 'SALES', 'DEVOPS', 'PRODUCT', 'DATA', 'SUPPORT', 'OTHER']).optional(),
  salaryRange: salaryRangeSchema,
  availability: z.enum(['IMMEDIATELY', 'TWO_WEEKS', 'ONE_MONTH_PLUS']).optional(),
});

// Keep legacy aliases for any existing consumers
export const step3Schema = step3SchemaLegacy;
export const step4Schema = step4SchemaPreferences;

/*
 * seekerOnboardingSchema
 * Top-level combined schema for the full seeker onboarding flow.
 */
export const seekerOnboardingSchema = z.object({
  step1: step1Schema,
  step2: step2Schema.optional(),
  step3: step3SchemaLegacy.optional(),
  step4: step4SchemaPreferences.optional(),
});

// Zod-inferred types (step 1 & 2 are straightforward)
export type Step1Input = z.infer<typeof step1Schema>;
export type Step2Input = z.infer<typeof step2Schema>;

// Legacy inferred types — kept as aliases to avoid breaking existing consumers
export type Step3SchemaInput = z.infer<typeof step3SchemaLegacy>;
export type Step4SchemaInput = z.infer<typeof step4SchemaPreferences>;

export type SeekerOnboardingInput = z.infer<typeof seekerOnboardingSchema>;

// ---------------------------------------------------------------------------
// Project / Work Experience / Education entry types (new 6-step onboarding)
// ---------------------------------------------------------------------------

/*
 * ProjectEntry
 * Represents a single project added by a seeker in step 3 (proof-of-work).
 */
export interface ProjectEntry {
  title: string;
  url: string;
  description: string;
}

/*
 * WorkExperienceEntry
 * Represents a single work experience record for a seeker.
 * startDate / endDate use "MM/YYYY" string format.
 */
export interface WorkExperienceEntry {
  company: string;
  title: string;
  startDate: string; // "MM/YYYY"
  endDate?: string | null; // "MM/YYYY"
  isCurrent: boolean;
  description?: string | null;
}

/*
 * EducationEntry
 * Represents a single education record for a seeker.
 * graduationDate uses "MM/YYYY" string format.
 */
export interface EducationEntry {
  institution: string;
  graduationDate?: string | null; // "MM/YYYY"
  degree?: string | null;
  major?: string | null;
}

// ---------------------------------------------------------------------------
// Zod schemas for new step entries
// ---------------------------------------------------------------------------

/*
 * projectEntrySchema
 * Validates a single project entry: title, valid URL, and a minimum description.
 */
export const projectEntrySchema = z.object({
  title: z.string().trim().min(1, 'Project title is required'),
  url: z.string().trim().url('Please enter a valid URL'),
  description: z.string().trim().min(20, 'Description must be at least 20 characters'),
});

/*
 * workExperienceEntrySchema
 * Validates a single work experience entry with required company and job title.
 */
export const workExperienceEntrySchema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  title: z.string().trim().min(1, 'Job title is required'),
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().nullable().optional(),
  isCurrent: z.boolean(),
  description: z.string().trim().nullable().optional(),
});

/*
 * educationEntrySchema
 * Validates a single education entry; only institution is required.
 */
export const educationEntrySchema = z.object({
  institution: z.string().trim().min(1, 'Institution is required'),
  graduationDate: z.string().trim().nullable().optional(),
  degree: z.string().trim().nullable().optional(),
  major: z.string().trim().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Step input interfaces and validate* helpers for the 6-step flow
// ---------------------------------------------------------------------------

/*
 * Step3Input
 * Input shape for step 3 (proof-of-work): GitHub profile, optional links, and projects.
 */
export interface Step3Input {
  githubUrl: string;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  videoIntroUrl?: string | null;
  projects: ProjectEntry[];
}

/*
 * validateSeekerStep3
 * Validates step 3 proof-of-work data.
 * Requires a valid GitHub profile URL and at least one valid project entry.
 * @returns { valid, errors }
 */
export function validateSeekerStep3(data: Step3Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.githubUrl?.trim()) {
    errors.push('GitHub profile URL is required');
  } else {
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/;
    if (!githubRegex.test(data.githubUrl.trim())) {
      errors.push('Please enter a valid GitHub profile URL (e.g. https://github.com/username)');
    }
  }
  if (!data.projects || data.projects.length === 0) {
    errors.push('Add at least one project');
  } else {
    for (const project of data.projects) {
      const result = projectEntrySchema.safeParse(project);
      if (!result.success) {
        errors.push(result.error.issues[0]?.message ?? 'Invalid project entry');
        break;
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/*
 * Step4Input
 * Input shape for step 4 (work experience & education).
 */
export interface Step4Input {
  workExperiences: WorkExperienceEntry[];
  educations?: EducationEntry[];
}

/*
 * validateSeekerStep4Experience
 * Validates step 4 work experience data.
 * Requires at least one valid work experience entry.
 * @returns { valid, errors }
 */
export function validateSeekerStep4Experience(data: Step4Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.workExperiences || data.workExperiences.length === 0) {
    errors.push('Add at least one work experience');
  } else {
    for (const exp of data.workExperiences) {
      const result = workExperienceEntrySchema.safeParse(exp);
      if (!result.success) {
        errors.push(result.error.issues[0]?.message ?? 'Invalid work experience');
        break;
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/*
 * Step5Input
 * Input shape for step 5 (professional profile & compensation).
 */
export interface Step5Input {
  headline: string;
  bio: string;
  salaryMin: number | null;
  salaryMax: number | null;
  availability: string | null;
  resume: unknown; // just check presence
}

/*
 * validateSeekerStep5
 * Validates step 5 professional profile and compensation data.
 * Requires headline, bio, salary range, availability, and resume.
 * @returns { valid, errors }
 */
export function validateSeekerStep5(data: Step5Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.headline?.trim()) errors.push('Professional headline is required');
  if (!data.bio?.trim()) errors.push('Bio is required');
  if (data.salaryMin === null) errors.push('Minimum salary is required');
  if (data.salaryMax === null) errors.push('Maximum salary is required');
  if (data.salaryMin !== null && data.salaryMax !== null && data.salaryMin > data.salaryMax) {
    errors.push('Minimum salary cannot exceed maximum salary');
  }
  if (!data.availability) errors.push('Please select your availability');
  if (!data.resume) errors.push('Resume is required');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Existing step 1 / 2 / preferences validators
// ---------------------------------------------------------------------------

/*
 * validateSeekerStep1
 * Validates step 1: requires situation and experience level selections.
 * @returns { valid, errors }
 */
export function validateSeekerStep1(data: Step1Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.situation) {
    errors.push('Please select your current situation');
  }
  if (!data.experienceLevel) {
    errors.push('Please select your experience level');
  }
  return { valid: errors.length === 0, errors };
}

/*
 * validateSeekerStep2
 * Validates step 2: requires primary role, years of experience, and at least one skill.
 * @returns { valid, errors }
 */
export function validateSeekerStep2(data: Step2Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.primaryRole?.trim()) {
    errors.push('Primary role is required');
  }
  if (!data.yearsOfExperience) {
    errors.push('Please select years of experience');
  }
  if (!data.skills || data.skills.length === 0) {
    errors.push('At least one skill is required');
  }
  return { valid: errors.length === 0, errors };
}

/*
 * validateSeekerStep4Preferences
 * Validates step 4 job preferences: job type, category, and availability.
 * Renamed from validateSeekerStep4 to avoid conflict with validateSeekerStep4Experience.
 * @returns { valid, errors }
 */
export function validateSeekerStep4Preferences(data: Step4SchemaInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.jobType) {
    errors.push('Please select job type');
  }
  if (!data.category) {
    errors.push('Please select category');
  }
  if (!data.availability) {
    errors.push('Please select availability');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * @deprecated Use validateSeekerStep4Preferences instead.
 * Kept for backward compatibility.
 */
export const validateSeekerStep4 = validateSeekerStep4Preferences;

// ---------------------------------------------------------------------------
// GitHub username extraction helper
// ---------------------------------------------------------------------------

/**
 * Extracts GitHub username from a GitHub profile URL.
 * e.g. "https://github.com/johndoe" → "johndoe"
 */
export function extractGithubUsername(url: string): string | null {
  try {
    const match = url.trim().match(/github\.com\/([a-zA-Z0-9_-]+)\/?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// UI constants
// ---------------------------------------------------------------------------

export const SUGGESTED_SKILLS = [
  'TypeScript',
  'Python',
  'Figma',
  'SQL',
  'AWS',
  'Go',
  'Vue',
  'Tailwind',
  'Docker',
  'GraphQL',
] as const;

export const YEARS_OPTIONS = [
  { value: 'LESS_THAN_1', label: '< 1 yr' },
  { value: '1_TO_3', label: '1–3 yrs' },
  { value: '3_TO_5', label: '3–5 yrs' },
  { value: '5_TO_10', label: '5–10 yrs' },
  { value: 'MORE_THAN_10', label: '10+ yrs' },
] as const;

export const JOB_CATEGORIES = [
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALES', label: 'Sales' },
  { value: 'DEVOPS', label: 'DevOps' },
  { value: 'PRODUCT', label: 'Product' },
  { value: 'DATA', label: 'Data' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const JOB_TYPES = [
  { value: OnboardingJobType.FULL_TIME, label: 'Full-time', icon: 'work' },
  { value: OnboardingJobType.CONTRACT, label: 'Contract', icon: 'sync' },
  { value: OnboardingJobType.BOTH, label: 'Both', icon: 'bolt' },
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: 'IMMEDIATELY', label: 'Immediately' },
  { value: 'TWO_WEEKS', label: '2 weeks notice' },
  { value: 'ONE_MONTH_PLUS', label: '1 month+' },
] as const;

/*
 * CURRENCIES
 * Locked to USD only — Hiretivo targets US/EU startups, all salaries in USD.
 */
export const CURRENCIES = [
  { value: CurrencyCode.USD, label: 'USD ($)' },
] as const;

export const SITUATION_OPTIONS = [
  {
    value: 'ACTIVELY_LOOKING',
    label: 'Actively looking',
    description: 'Ready to apply now',
    icon: '🔍'
  },
  {
    value: 'OPEN_TO_OFFERS',
    label: 'Open to offers',
    description: 'Not urgent but interested',
    icon: '👀'
  },
  {
    value: 'EXPLORING_OPTIONS',
    label: 'Exploring options',
    description: 'Just browsing for now',
    icon: '📚'
  },
  {
    value: 'STUDENT_FRESH_GRAD',
    label: 'Student / Fresh grad',
    description: 'Starting my career',
    icon: '🎓'
  },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry (0–1yr)' },
  { value: 'JUNIOR', label: 'Junior (1–3yr)' },
  { value: 'MID', label: 'Mid (3–6yr)' },
  { value: 'SENIOR', label: 'Senior (6yr+)' },
] as const;
