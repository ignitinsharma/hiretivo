import { apiClient } from '@/lib/axios';
import type { SeekerSettingsInput } from '@/lib/validations/seeker.schema';
import type { JobListItem } from '@/modules/jobs/types/job.types';
import type {
  SeekerDashboardData,
  SeekerInterview,
} from '@/modules/seeker/dashboard/types/dashboard.types';

interface DataResponse<T> {
  data: T;
}

export interface SeekerFeedResponse {
  jobs: JobListItem[];
  nextCursor: string | null;
  totalCount?: number;
  remainingCount?: number;
  hasMoreRecent?: boolean;
}

export interface SeekerSettingsData {
  name: string;
  email: string;
  phone: string;
  headline: string;
  bio: string;
  location: string | null;
  city: string | null;
  state: string | null;
  resumeKey: string | null;
  skills: Array<{ id: string; name: string; slug: string }>;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
}

export const seekerService = {
  getFeed: async (
    params?: { cursor?: string; limit?: number; q?: string; jobType?: string; workType?: string; locationClass?: string; visaSponsored?: boolean; experienceLevel?: string },
    signal?: AbortSignal,
  ): Promise<SeekerFeedResponse> => {
    const { data } = await apiClient.get<SeekerFeedResponse>('/seeker/feed', { params, signal });
    return data;
  },

  getBrowseFeed: async (
    params?: { cursor?: string; limit?: number; q?: string; jobType?: string; workType?: string; locationClass?: string; visaSponsored?: boolean; experienceLevel?: string },
    signal?: AbortSignal,
  ): Promise<SeekerFeedResponse> => {
    const { data } = await apiClient.get<SeekerFeedResponse>('/seeker/browse', { params, signal });
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

  updateSettings: async (payload: Partial<SeekerSettingsInput>): Promise<void> => {
    await apiClient.patch('/seeker/settings', payload);
  },

  getUpcomingInterviews: async (): Promise<SeekerInterview[]> => {
    const { data } = await apiClient.get<DataResponse<SeekerInterview[]>>('/seeker/interviews');
    return data.data;
  },
};
