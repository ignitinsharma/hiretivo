import { z } from 'zod';

export type {
  SeekerSituation,
  YearsOfExperience,
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
});

export const step2Schema = z.object({
  primaryRole: z.string().min(1, 'Primary role is required'),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
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
  targetSalaryMin: z.number().int().min(1000).max(1000000).nullable(),
  targetSalaryMax: z.number().int().min(1000).max(1000000).nullable(),
  timezoneOverlapHours: z.number().int().min(0).max(16).nullable(),
  availableFrom: z.string().min(1).nullable(),
}).refine(
  (data) => {
    if (data.targetSalaryMin !== null && data.targetSalaryMax !== null) {
      return data.targetSalaryMin <= data.targetSalaryMax;
    }
    return true;
  },
  { message: "Maximum salary must be greater than or equal to minimum salary" },
);

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
  return { valid: errors.length === 0, errors };
}

export function validateSeekerStep2(data: Step2Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.primaryRole?.trim()) {
    errors.push("Primary role is required");
  }
  if (typeof data.yearsOfExperience !== "number" || data.yearsOfExperience < 0) {
    errors.push("Please enter years of experience");
  }
  if (!data.skills || data.skills.length === 0) {
    errors.push("At least one skill is required");
  }
  return { valid: errors.length === 0, errors };
}

export function validateSeekerStep4(data: Step4Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof data.targetSalaryMin !== "number") {
    errors.push("Please enter minimum target salary");
  }
  if (typeof data.targetSalaryMax !== "number") {
    errors.push("Please enter maximum target salary");
  }
  if (
    typeof data.targetSalaryMin === "number" &&
    typeof data.targetSalaryMax === "number" &&
    data.targetSalaryMax < data.targetSalaryMin
  ) {
    errors.push("Maximum salary must be greater than or equal to minimum salary");
  }
  if (typeof data.timezoneOverlapHours !== "number") {
    errors.push("Please enter timezone overlap hours");
  }
  if (!data.availableFrom) {
    errors.push("Please select availability date");
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
