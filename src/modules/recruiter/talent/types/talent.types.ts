export interface TalentListItem {
  id: string;
  isUnlocked: boolean;
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
    demoCount: number;    // Count of all seekers with a profile (unaffected by search filters)
    isFreePlan: boolean;  // true when caller is on FREE plan (items are blurred), false for paid
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
  isUnlocked: boolean;
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
  links: TalentProfileLinks | null;
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
