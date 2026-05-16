/*
 * Talent pool type definitions.
 * LockedEngineer: base card data (no PII).
 * UnlockedEngineer: LockedEngineer + PII fields after unlock.
 * TalentFilters: query params for talent pool browse.
 */

export interface LockedEngineer {
  id: string;
  firstName: string;
  lastInitial: string;
  hiretivoScore: number;
  role: string;
  yearsExperience: number;
  skills: string[];
  salaryMinUsd: number;
  salaryMaxUsd: number;
  timezoneOverlapHours: number;
  availableFrom: string | null;
  isUnlocked: boolean;
  isSaved: boolean;
}

export interface UnlockedEngineer extends LockedEngineer {
  fullName: string;
  email: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
}

export type TalentEngineer = LockedEngineer | UnlockedEngineer;

export function isUnlocked(eng: TalentEngineer): eng is UnlockedEngineer {
  return eng.isUnlocked && "fullName" in eng;
}

export interface TalentFilters {
  skills?: string;        // comma-separated
  role?: string;
  salaryMax?: number;
  timezoneOverlapMin?: number;
  availableBefore?: string;
}

export interface SavedEngineerItem extends LockedEngineer {
  savedAt?: string;
}

/* ─── Legacy types (kept for backward compat) ─── */

export interface TalentListItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  headline: string | null;
  bioExcerpt: string | null;
  location: string | null;
  yearsExperience: number | null;
  primaryRole: string | null;
  availability: string | null;
  resumeKey: boolean;
  skills: string[];
}

export interface TalentListResponse {
  data: {
    items: TalentListItem[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface TalentSkill {
  name: string;
  category: string;
  level: string;
}

export interface TalentProfileLinks {
  websiteUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
}

export interface TalentWorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  positionType: string | null;
  skills: string[];
}

export interface TalentEducation {
  id: string;
  institution: string;
  graduationDate: string | null;
  degree: string | null;
  major: string | null;
}

export interface TalentDetail {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  yearsExperience: number | null;
  primaryRole: string | null;
  availability: string | null;
  resumeKey: boolean;
  resumeUrl: string | null;
  skills: TalentSkill[];
  links: TalentProfileLinks;
  workExperiences: TalentWorkExperience[];
  educations: TalentEducation[];
  profile: {
    workPreference: string | null;
    situation: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string | null;
  };
}

export interface TalentDetailResponse {
  data: TalentDetail;
}
