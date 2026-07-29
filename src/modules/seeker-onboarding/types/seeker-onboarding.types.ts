export type SeekerSituation =
  | 'ACTIVELY_LOOKING'
  | 'OPEN_TO_OFFERS'
  | 'EXPLORING_OPTIONS'
  | 'STUDENT_FRESH_GRAD';

export interface ResumeFile {
  name: string;
  size: number;
  type: string;
  key: string | null;
  url: string | null;
  file: File | null;
}

export interface Step1Data {
  name: string;
  phone: string;
  linkedinUrl: string;
  githubUrl: string | null;
  portfolioUrl: string | null;
  situation: SeekerSituation | null;
}

export interface Step3Data {
  resume: ResumeFile | null;
}

export type SeekerOnboardingStep = 1 | 2;
