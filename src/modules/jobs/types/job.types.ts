export interface JobListItem {
  id: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string;
  salaryRange: string;
  matchScore?: number;
  tags?: string[];
  postedAt?: string;
  jobType?: string;
  workType?: string | null;
  experienceLevel?: string | null;
  companyIndustry?: string | null;
  companySize?: string | null;
  companyFundingType?: string | null;
  matchedSkillNames?: string[];
  applyType?: string;
  externalApplyUrl?: string | null;
  /** Exact skill names the seeker is missing for this job (seeker feed only). */
  missingSkills?: string[];
  /** Compact inline explainer for low-match cards, e.g. "Missing: Docker, AWS". Null when not applicable. */
  missingSkillsHint?: string | null;
}

export interface JobSkillItem {
  id: string;
  name: string;
  slug: string;
  level: string;
}

export interface JobMatchBreakdown {
  skillId: string;
  skillName: string;
  isMatch: boolean;
}

export interface JobDetailResponse {
  job: {
    id: string;
    title: string;
    description: string;
    jobType: string;
    workType: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string | null;
    experienceLevel: string | null;
    category: string | null;
    applyType: string;
    externalApplyUrl: string | null;
    companyName: string;
    companyLogoUrl: string | null;
    skills: JobSkillItem[];
    publishedAt: string | null;
  };
  matchScore: number | null;
  matchBreakdown: JobMatchBreakdown[] | null;
}
