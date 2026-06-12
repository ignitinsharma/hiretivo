import type { ProjectEntry, WorkExperienceEntry, EducationEntry } from '@/lib/validations/seeker-onboarding.schema';
import type { CurrencyCode, OnboardingJobType } from '@/constants/enums';

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

/*
 * SalaryRangeUsd
 * USD-only salary range (no currency field — locked to USD).
 */
export interface SalaryRangeUsd {
  min: number | null;
  max: number | null;
}

export interface ResumeFile {
  name: string;
  size: number;
  type: string;
  key: string | null;
  url: string | null;
  file: File | null;
}

/*
 * Step1Data
 * Seeker situation and experience level selections (step 1).
 */
export interface Step1Data {
  situation: SeekerSituation | null;
  experienceLevel: ExperienceLevel | null;
  city: string | null;
  state: string | null;
}

/*
 * Step2Data
 * Primary role, years of experience, and skills selection (step 2).
 */
export interface Step2Data {
  primaryRole: string;
  yearsOfExperience: YearsOfExperience | null;
  skills: string[];
}

/*
 * ProofOfWorkData
 * Step 3: Seeker's proof of work — GitHub, optional links, and project entries.
 */
export interface ProofOfWorkData {
  githubUrl: string;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  videoIntroUrl: string | null;
  projects: ProjectEntry[];
}

/*
 * ExperienceData
 * Step 4: Work experience and education history.
 */
export interface ExperienceData {
  workExperiences: WorkExperienceEntry[];
  educations: EducationEntry[];
}

/*
 * CompensationData
 * Step 5: Professional headline, bio, salary expectations, availability, work preference, and resume.
 */
export interface CompensationData {
  headline: string;
  bio: string;
  salaryMin: number | null;
  salaryMax: number | null;
  availability: string | null;
  workPreference: string | null;
  resume: ResumeFile | null;
}

/*
 * SeekerOnboardingData
 * Full shape of seeker onboarding data across all 7 steps.
 */
export interface SeekerOnboardingData {
  step1: Step1Data;
  step2: Step2Data;
  proofOfWork: ProofOfWorkData;
  experience: ExperienceData;
  compensation: CompensationData;
}

export type SeekerOnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ---------------------------------------------------------------------------
// Legacy step interfaces — kept for backward compatibility with existing
// step components that have not yet been migrated to the new 7-step flow.
// ---------------------------------------------------------------------------

/** @deprecated Use ProofOfWorkData instead (new step 3). */
export interface Step3Data {
  resume: ResumeFile | null;
}

/** @deprecated Use ExperienceData / CompensationData instead. */
export interface Step4Data {
  jobType: JobType | null;
  category: JobCategory | null;
  salaryRange: SalaryRange;
  availability: Availability | null;
}
