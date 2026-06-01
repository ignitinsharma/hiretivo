export type SeekerSituation = 
  | 'ACTIVELY_LOOKING' 
  | 'OPEN_TO_OFFERS' 
  | 'EXPLORING_OPTIONS' 
  | 'STUDENT_FRESH_GRAD';

export type ExperienceLevel = 
  | 'ENTRY' 
  | 'JUNIOR' 
  | 'MID' 
  | 'SENIOR';

export type YearsOfExperience = 
  | 'LESS_THAN_1' 
  | '1_TO_3' 
  | '3_TO_5' 
  | '5_TO_10' 
  | 'MORE_THAN_10';

export type JobType =
  | OnboardingJobType.FULL_TIME
  | OnboardingJobType.CONTRACT
  | OnboardingJobType.BOTH;

export type JobCategory = 
  | 'ENGINEERING' 
  | 'DESIGN' 
  | 'MARKETING' 
  | 'SALES' 
  | 'DEVOPS' 
  | 'PRODUCT' 
  | 'DATA' 
  | 'SUPPORT' 
  | 'OTHER';

export type Currency = CurrencyCode.USD;

export type Availability = 
  | 'IMMEDIATELY' 
  | 'TWO_WEEKS' 
  | 'ONE_MONTH_PLUS';

export interface SalaryRange {
  min: number | null;
  max: number | null;
  currency: Currency;
}

export interface ResumeFile {
  name: string;
  size: number;
  type: string;
  key: string | null;
  url: string | null;
  file: File | null;
}

export interface Step1Data {
  situation: SeekerSituation | null;
  experienceLevel: ExperienceLevel | null;
}

export interface Step2Data {
  primaryRole: string;
  yearsOfExperience: YearsOfExperience | null;
  skills: string[];
}

export interface Step3Data {
  resume: ResumeFile | null;
}

export interface Step4Data {
  jobType: JobType | null;
  category: JobCategory | null;
  salaryRange: SalaryRange;
  availability: Availability | null;
}

export interface SeekerOnboardingData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}

export type SeekerOnboardingStep = 1 | 2 | 3 | 4 | 5;
import type { CurrencyCode, OnboardingJobType } from '@/constants/enums';
