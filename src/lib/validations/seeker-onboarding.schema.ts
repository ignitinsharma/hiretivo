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
  situation: z.enum(
    ['ACTIVELY_LOOKING', 'OPEN_TO_OFFERS', 'EXPLORING_OPTIONS', 'STUDENT_FRESH_GRAD'],
    { message: "Please select your current situation" },
  ),
});

export const step2Schema = z.object({
  primaryRole: z.string().min(1, 'Primary role is required'),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
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
  targetSalaryMin: z.number({ message: "Please enter minimum target salary" }).int().min(1000).max(1000000),
  targetSalaryMax: z.number({ message: "Please enter maximum target salary" }).int().min(1000).max(1000000),
  timezoneOverlapHours: z.number({ message: "Select your live meeting availability" }).int().min(0).max(16),
  availableFrom: z.string({ message: "Please select availability date" }).min(1),
}).refine(
  (data) => data.targetSalaryMin <= data.targetSalaryMax,
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
