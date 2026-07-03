import { apiClient } from '@/lib/axios';
import type { SeekerSettingsInput } from '@/lib/validations/seeker.schema';
import type { CertificationInput } from '@/lib/validations/certification.schema';
import type { ApplicationDefaultsInput } from '@/lib/validations/application-defaults.schema';
import type { ProjectInput } from '@/lib/validations/project.schema';
import type { OptimizeMode } from '@/constants/enums';
import type { JobDetailResponse, JobListItem } from '@/modules/jobs/types/job.types';
import type { FeedFilters } from '@/modules/seeker/feed/types/feed.types';
import type {
  ProfileStrengthSummary,
  SeekerDashboardData,
  SeekerInterview,
} from '@/modules/seeker/dashboard/types/dashboard.types';

interface DataResponse<T> {
  data: T;
}

export interface CertificationItem extends CertificationInput {
  id: string;
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
  image: string | null;
  headline: string;
  bio: string;
  location: string | null;    // raw stored value — kept for recruiter display
  city: string | null;        // derived by GET endpoint via parseLegacyLocation
  state: string | null;       // derived by GET endpoint via parseLegacyLocation
  situation: string;
  primaryRole: string;
  workPreference: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  availability: string;
  resumeKey: string | null;
  skills: Array<{ id: string; name: string; slug: string }>;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  yearsExperience: number | null;
  profileStrength: ProfileStrengthSummary;
  workExperiences: WorkExperienceItem[];
  educations: EducationItem[];
}

export const seekerService = {
  getFeed: async (
    params?: { cursor?: string; limit?: number } & Partial<FeedFilters>,
  ): Promise<SeekerFeedResponse> => {
    const { companies, ...rest } = params ?? {};
    const query = { ...rest, companies: companies?.length ? companies.join(',') : undefined };
    const { data } = await apiClient.get<SeekerFeedResponse>('/seeker/feed', { params: query });
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

  /* getJobDetail — reuses the public GET /api/jobs/[id] endpoint (already auth-aware for match data). */
  getJobDetail: async (jobId: string): Promise<JobDetailResponse> => {
    const { data } = await apiClient.get<JobDetailResponse>(`/jobs/${jobId}`);
    return data;
  },

  getCertifications: async (): Promise<DataResponse<{ certifications: CertificationItem[] }>> => {
    const { data } = await apiClient.get<DataResponse<{ certifications: CertificationItem[] }>>(
      '/seeker/certifications',
    );
    return data;
  },

  updateCertifications: async (certifications: CertificationInput[]): Promise<void> => {
    await apiClient.put('/seeker/certifications', { certifications });
  },

  getApplicationDefaults: async (): Promise<DataResponse<ApplicationDefaultsInput | null>> => {
    const { data } = await apiClient.get<DataResponse<ApplicationDefaultsInput | null>>(
      '/seeker/application-defaults',
    );
    return data;
  },

  updateApplicationDefaults: async (payload: ApplicationDefaultsInput): Promise<void> => {
    await apiClient.put('/seeker/application-defaults', payload);
  },

  getProjects: async (): Promise<DataResponse<{ projects: ProjectInput[] }>> => {
    const { data } = await apiClient.get<DataResponse<{ projects: ProjectInput[] }>>('/seeker/projects');
    return data;
  },

  updateProjects: async (projects: ProjectInput[]): Promise<void> => {
    await apiClient.put('/seeker/projects', { projects });
  },

  getOptimizeMode: async (): Promise<DataResponse<{ optimizeMode: OptimizeMode }>> => {
    const { data } = await apiClient.get<DataResponse<{ optimizeMode: OptimizeMode }>>('/seeker/optimize-mode');
    return data;
  },

  updateOptimizeMode: async (optimizeMode: OptimizeMode): Promise<void> => {
    await apiClient.patch('/seeker/optimize-mode', { optimizeMode });
  },
};
