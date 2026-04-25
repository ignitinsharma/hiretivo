import { z } from 'zod';
import { RECRUITER_ONBOARDING_JOB_TYPE_VALUES } from '@/constants/enums';

export type {
  RecruiterRole,
  HiringScale,
  CompanySize,
  Industry,
  FundingType,
  JobType,
  ExperienceLevel,
  JobCategory,
  TeamMemberRole,
} from '@/modules/onboarding/types/onboarding.types';

export const step1Schema = z.object({
  role: z.enum(['HIRING_MANAGER', 'HR_RECRUITER', 'OTHER']).optional(),
  hiringScale: z.enum(['1-5', '6-20', '21-50', '50+']).optional(),
});

export const step2Schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyWebsite: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  industry: z.enum(['TECHNOLOGY', 'FINANCE', 'HEALTHCARE', 'EDUCATION', 'OTHER']).optional(),
  fundingType: z.enum([
    'BOOTSTRAPPED',
    'PRE_SEED',
    'SEED',
    'SERIES_A',
    'SERIES_B',
    'SERIES_C',
    'SERIES_C_PLUS',
    'PUBLICLY_TRADED',
  ]).optional(),
  isFullyRemote: z.boolean(),
  logoUrl: z.string().nullable(),
});

export const salaryRangeSchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
}).refine(
  (data) => {
    if (data.min !== null && data.max !== null) {
      return data.min <= data.max;
    }
    return true;
  },
  { message: 'Minimum salary cannot be greater than maximum salary' }
);

export const step3Schema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  jobType: z.enum(RECRUITER_ONBOARDING_JOB_TYPE_VALUES).optional(),
  experienceLevel: z.enum(['ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR', 'LEAD_DIRECTOR']).optional(),
  category: z.enum(['ENGINEERING', 'DESIGN', 'MARKETING', 'PRODUCT_MANAGEMENT', 'SALES']).optional(),
  salaryRange: salaryRangeSchema,
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  requiredSkills: z.array(z.string()).min(1, 'At least one skill is required'),
});

export const onboardingSchema = z.object({
  step1: step1Schema,
  step2: step2Schema.optional(),
  step3: step3Schema.optional(),
});

export type Step1Input = z.infer<typeof step1Schema>;
export type Step2Input = z.infer<typeof step2Schema>;
export type Step3Input = z.infer<typeof step3Schema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export function validateStep1(data: Step1Input): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.role) {
    errors.push('Please select your role');
  }
  if (!data.hiringScale) {
    errors.push('Please select hiring scale');
  }
  return { valid: errors.length === 0, errors };
}
