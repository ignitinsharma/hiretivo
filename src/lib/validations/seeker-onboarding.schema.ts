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

export const step1Schema = z.object({
  situation: z.enum(['ACTIVELY_LOOKING', 'OPEN_TO_OFFERS', 'EXPLORING_OPTIONS', 'STUDENT_FRESH_GRAD']).optional(),
  experienceLevel: z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR']).optional(),
});

export const salaryRangeSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
  currency: z.enum(SEEKER_CURRENCY_VALUES),
}).refine(
  (data) => {
    if (data.min !== null && data.max !== null) {
      return data.min <= data.max;
    }
    return true;
  },
  { message: 'Minimum salary cannot be greater than maximum salary' }
);

export const step2Schema = z.object({
  primaryRole: z.string().min(1, 'Primary role is required'),
  yearsOfExperience: z.enum(['LESS_THAN_1', '1_TO_3', '3_TO_5', '5_TO_10', 'MORE_THAN_10']).optional(),
  skills: z.array(z.string()),
});

export const resumeFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  key: z.string().nullable(),
  url: z.string().nullable(),
});

export const step3Schema = z.object({
  resume: resumeFileSchema.nullable(),
});

export const step4Schema = z.object({
  jobType: z.enum(SEEKER_ONBOARDING_JOB_TYPE_VALUES).optional(),
  category: z.enum(['ENGINEERING', 'DESIGN', 'MARKETING', 'SALES', 'DEVOPS', 'PRODUCT', 'DATA', 'SUPPORT', 'OTHER']).optional(),
  salaryRange: salaryRangeSchema,
  availability: z.enum(['IMMEDIATELY', 'TWO_WEEKS', 'ONE_MONTH_PLUS']).optional(),
});

export const seekerOnboardingSchema = z.object({
  step1: step1Schema,
  step2: step2Schema.optional(),
  step3: step3Schema.optional(),
  step4: step4Schema.optional(),
});

export type Step1Input = z.infer<typeof step1Schema>;
export type Step2Input = z.infer<typeof step2Schema>;
export type Step3Input = z.infer<typeof step3Schema>;
export type Step4Input = z.infer<typeof step4Schema>;
export type SeekerOnboardingInput = z.infer<typeof seekerOnboardingSchema>;

export function validateSeekerStep1(data: Step1Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.situation) {
    errors.push("Please select your current situation");
  }
  if (!data.experienceLevel) {
    errors.push("Please select your experience level");
  }
  return { valid: errors.length === 0, errors };
}

export function validateSeekerStep2(data: Step2Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.primaryRole?.trim()) {
    errors.push("Primary role is required");
  }
  if (!data.yearsOfExperience) {
    errors.push("Please select years of experience");
  }
  if (!data.skills || data.skills.length === 0) {
    errors.push("At least one skill is required");
  }
  return { valid: errors.length === 0, errors };
}

export function validateSeekerStep4(data: Step4Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.jobType) {
    errors.push("Please select job type");
  }
  if (!data.category) {
    errors.push("Please select category");
  }
  if (!data.availability) {
    errors.push("Please select availability");
  }
  return { valid: errors.length === 0, errors };
}

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

export const CURRENCIES = [
  { value: CurrencyCode.USD, label: 'USD' },
  { value: CurrencyCode.EUR, label: 'EUR' },
  { value: CurrencyCode.GBP, label: 'GBP' },
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
