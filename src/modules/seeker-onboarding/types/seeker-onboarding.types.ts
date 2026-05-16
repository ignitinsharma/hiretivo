export type SeekerSituation = 
  | 'ACTIVELY_LOOKING' 
  | 'OPEN_TO_OFFERS' 
  | 'EXPLORING_OPTIONS' 
  | 'STUDENT_FRESH_GRAD';

export type YearsOfExperience = number;

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
}

export interface Step2Data {
  primaryRole: string;
  yearsOfExperience: number | null;
  skills: string[];
}

export interface Step3Data {
  resume: ResumeFile | null;
}

export interface Step4Data {
  targetSalaryMin: number | null;
  targetSalaryMax: number | null;
  timezoneOverlapHours: number | null;
  availableFrom: string | null;
}

export interface SeekerOnboardingData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}

export type SeekerOnboardingStep = 1 | 2 | 3 | 4 | 5;
