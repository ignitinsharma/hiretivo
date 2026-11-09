import { apiClient } from '@/lib/axios';
import { isAxiosError } from 'axios';
import { ApplicationStatus } from '@/constants/enums';
import type { CreateApplicationInput } from '@/lib/validations/application';
import type { ExternalApplicationInput } from '@/lib/validations/external-application';
import type { SeekerApplicationItem } from '@/modules/seeker/applications/types/application.types';

interface ApplicationApiItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId?: string | null;
  companyName: string;
  companyLogoUrl?: string | null;
  location?: string | null;
  salaryRange: string;
  jobType: string;
  workType: string | null;
  experienceLevel: string | null;
  companyIndustry: string | null;
  companySize: string | null;
  companyFundingType: string | null;
  automationStatus?: string | null;
  failureReason?: string | null;
  skills: string[];
  status: SeekerApplicationItem['status'];
  appliedAt: string;
  pipelineStage?: string;
}

export const applicationService = {
  applyToJob: async (payload: CreateApplicationInput): Promise<{ id: string }> => {
    const { data } = await apiClient.post<{ id: string }>('/applications', payload);
    return data;
  },

  ensureApplication: async (jobId: string): Promise<{ id: string }> => {
    const { data } = await apiClient.post<{ id: string }>('/applications/ensure', { jobId });
    return data;
  },

  logExternalJob: async (payload: ExternalApplicationInput): Promise<{ id: string }> => {
    const { data } = await apiClient.post<{ id: string }>('/applications/log-external', payload);
    return data;
  },

  generateResume: async (applicationId: string): Promise<void> => {
    try {
      const { data } = await apiClient.post<{ status?: string; failureReason?: string }>(`/applications/${applicationId}/generate`);
      if (data.status === "FAILED") throw new Error(data.failureReason ?? "Resume generation failed");
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error) && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  getMyApplications: async (): Promise<SeekerApplicationItem[]> => {
    // Kanban needs all applications, not paginated 10 — fetch with large limit
    const { data } = await apiClient.get<{ data: ApplicationApiItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | ApplicationApiItem[]>('/applications', { params: { limit: 100, page: 1 } });
    const raw = Array.isArray(data) ? data : (data as any).data ?? data;
    return (raw as ApplicationApiItem[]).map((application) => ({
      ...application,
      companyLogoUrl: application.companyLogoUrl ?? undefined,
      salaryRange: application.salaryRange,
      jobType: application.jobType,
      workType: application.workType,
      experienceLevel: application.experienceLevel,
      companyIndustry: application.companyIndustry,
      companySize: application.companySize,
      companyFundingType: application.companyFundingType,
      automationStatus: (application as any).automationStatus ?? null,
      failureReason: (application as any).failureReason ?? null,
      skills: application.skills,
      pipelineStage: application.pipelineStage as SeekerApplicationItem['pipelineStage'],
      appliedAt: application.appliedAt,
    })) as SeekerApplicationItem[];
  },

  getMyApplicationsPaginated: async (params?: { page?: number; limit?: number; q?: string; tab?: string }): Promise<{ data: SeekerApplicationItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const { data } = await apiClient.get<{ data: ApplicationApiItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | ApplicationApiItem[]>('/applications', { params });
    const raw = Array.isArray(data) ? data : (data as any).data ?? [];
    const pagination = Array.isArray(data) ? { page: 1, limit: raw.length, total: raw.length, totalPages: 1 } : (data as any).pagination;
    const mapped = (raw as ApplicationApiItem[]).map((application) => ({
      ...application,
      companyLogoUrl: application.companyLogoUrl ?? undefined,
      salaryRange: application.salaryRange,
      jobType: application.jobType,
      workType: application.workType,
      experienceLevel: application.experienceLevel,
      companyIndustry: application.companyIndustry,
      companySize: application.companySize,
      companyFundingType: application.companyFundingType,
      automationStatus: (application as any).automationStatus ?? null,
      failureReason: (application as any).failureReason ?? null,
      skills: application.skills,
      pipelineStage: application.pipelineStage as SeekerApplicationItem['pipelineStage'],
      appliedAt: application.appliedAt,
    })) as SeekerApplicationItem[];
    return { data: mapped, pagination };
  },

  updateApplicationStatus: async (applicationId: string, status: ApplicationStatus): Promise<void> => {
    await apiClient.patch(`/applications/${applicationId}/status`, { status });
  },

  markApplied: async (applicationId: string): Promise<void> => {
    await apiClient.patch(`/applications/${applicationId}`, { action: "mark_applied" });
  },

  updatePipelineStage: async (applicationId: string, stage: string): Promise<void> => {
    await apiClient.patch(`/applications/${applicationId}`, {
      action: "update_pipeline_stage",
      pipelineStage: stage,
    });
  },

  revertToNotApplied: async (applicationId: string): Promise<void> => {
    await apiClient.patch(`/applications/${applicationId}`, { action: "revert_to_not_applied" });
  },
};
