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