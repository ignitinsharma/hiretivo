import { apiClient } from '@/lib/axios';
import type { SeekerSettingsInput } from '@/lib/validations/seeker.schema';
import type { CodingProfileInput } from '@/lib/verification/coding-profiles';
import type { JobListItem } from '@/modules/jobs/types/job.types';
import type { SeekerDashboardData, SeekerInterview } from '@/modules/seeker/dashboard/types/dashboard.types';

interface DataResponse<T> {
  data: T;
}

export interface WorkExperienceItem {
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

export interface EducationItem {
  id: string;
  institution: string;
  graduationDate: string | null;
  degree: string | null;
  major: string | null;
}

export interface SeekerProjectItem {
  name: string;
  description: string;
  sourceUrl: string;
  liveUrl: string | null;
}

export interface SeekerFeedResponse {
  jobs: JobListItem[];
  nextCursor: string | null;
  totalCount?: number;
  remainingCount?: number;
}

export interface SeekerSettingsData {
  name: string;
  email: string;
  image: string | null;
  timezone: string | null;
  headline: string;
  bio: string;
  location: string;
  situation: string;
  primaryRole: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  availability: string;
  resumeKey: string | null;
  hiddenUntil: string | null;
  skills: Array<{ id: string; name: string; slug: string }>;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  codingProfiles: CodingProfileInput[];
  yearsExperience: number | null;
  topProjects: SeekerProjectItem[];
  workExperiences: WorkExperienceItem[];
  educations: EducationItem[];
}

export const seekerService = {
  getFeed: async (): Promise<SeekerFeedResponse> => {
    const { data } = await apiClient.get<SeekerFeedResponse>('/seeker/feed');
    return data;
  },

  getDashboardSummary: async (): Promise<SeekerDashboardData> => {
    const { data } = await apiClient.get<DataResponse<SeekerDashboardData>>('/seeker/dashboard');
    return data.data;
  },

  updateDigestPreference: async (enabled: boolean): Promise<void> => {
    await apiClient.patch('/seeker/digest', { enabled });
  },

  dismissJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`/seeker/dismissed-jobs/${jobId}`);
  },

  getSettings: async (): Promise<DataResponse<SeekerSettingsData>> => {
    const { data } = await apiClient.get<DataResponse<SeekerSettingsData>>('/seeker/settings');
    return data;
  },

  updateSettings: async (payload: SeekerSettingsInput): Promise<void> => {
    await apiClient.patch('/seeker/settings', payload);
  },

  getUpcomingInterviews: async (): Promise<SeekerInterview[]> => {
    const { data } = await apiClient.get<DataResponse<SeekerInterview[]>>('/seeker/interviews');
    return data.data;
  },
};
