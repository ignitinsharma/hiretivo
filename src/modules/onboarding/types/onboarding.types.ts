export type RecruiterRole = 'HIRING_MANAGER' | 'HR_RECRUITER' | 'OTHER';

export type HiringScale = '1-5' | '6-20' | '21-50' | '50+';

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

export type Industry = 'TECHNOLOGY' | 'FINANCE' | 'HEALTHCARE' | 'EDUCATION' | 'OTHER';

export type FundingType = 
  | 'BOOTSTRAPPED' 
  | 'PRE_SEED' 
  | 'SEED' 
  | 'SERIES_A' 
  | 'SERIES_B' 
  | 'SERIES_C' 
  | 'SERIES_C_PLUS' 
  | 'PUBLICLY_TRADED';

export type JobType =
  | OnboardingJobType.FULL_TIME
  | OnboardingJobType.CONTRACT
  | OnboardingJobType.PART_TIME
  | OnboardingJobType.FREELANCE;

export type ExperienceLevel = 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR' | 'LEAD_DIRECTOR';

export type JobCategory = 'ENGINEERING' | 'DESIGN' | 'MARKETING' | 'PRODUCT_MANAGEMENT' | 'SALES';

export type TeamMemberRole = 'ADMIN' | 'REVIEWER' | 'VIEWER';

export interface Step1Data {
  role: RecruiterRole | null;
  hiringScale: HiringScale | null;
}

export interface Step2Data {
  companyName: string;
  companyWebsite: string;
  companySize: CompanySize | null;
  industry: Industry | null;
  fundingType: FundingType | null;
  isFullyRemote: boolean;
  logoUrl: string | null;
}

export interface SalaryRange {
  min: number | null;
  max: number | null;
}

export interface Step3Data {
  jobTitle: string;
  jobType: JobType | null;
  experienceLevel: ExperienceLevel | null;
  category: JobCategory | null;
  salaryRange: SalaryRange;
  jobDescription: string;
  requiredSkills: string[];
}

export interface OnboardingData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
}

export type OnboardingStep = 1 | 2 | 3 | 4;
import type { OnboardingJobType } from '@/constants/enums';
