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
  isShortlisted: boolean;
}

export interface TalentListResponse {
  data: {
    items: TalentListItem[];
    total: number;
    page: number;
    limit: number;
  };
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
  isShortlisted: boolean;
  skills: Array<{
    name: string;
    category: string;
    level: string;
  }>;
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
