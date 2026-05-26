import { apiClient } from '@/lib/axios';
import type { ApplyType, JobStatus, JobType, SkillLevel, WorkType } from '@/constants/enums';
import type { JobDetailResponse } from '@/modules/jobs/types/job.types';

export interface ApiJob {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  status: JobStatus;
  createdAt: string;
  _count: { applications: number };
  skills: { skill: { id: string; name: string; category: string } }[];
}

export interface GetJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface JobsApiResponse {
  jobs: ApiJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalAll: number;
    activeCount: number;
    totalApplicants: number;
  };
  categories: string[];
}

export interface JobMutationPayload {
  title: string;
  description: string;
  jobType: JobType;
  applyType: ApplyType;
  externalApplyUrl?: string;
  workType?: WorkType;
  experienceLevel?: string;
  category?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  skills: Array<{
    skillId: string;
    level: SkillLevel;
  }>;
}

export const jobService = {
  getJobs: async (params?: GetJobsParams): Promise<JobsApiResponse> => {
    const { data } = await apiClient.get<JobsApiResponse>('/jobs', { params });
    return data;
  },

  getJobById: async (id: string): Promise<JobDetailResponse> => {
    const { data } = await apiClient.get<JobDetailResponse>(`/jobs/${id}`);
    return data;
  },

  createJob: async (payload: JobMutationPayload): Promise<ApiJob> => {
    const { data } = await apiClient.post<ApiJob>('/jobs', payload);
    return data;
  },

  updateJob: async (id: string, payload: Partial<JobMutationPayload>): Promise<ApiJob> => {
    const { data } = await apiClient.patch<ApiJob>(`/jobs/${id}`, payload);
    return data;
  },
};
