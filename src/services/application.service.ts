import { format } from 'date-fns';
import { apiClient } from '@/lib/axios';
import { ApplicationStatus } from '@/constants/enums';
import type { CreateApplicationInput } from '@/lib/validations/application';
import type { SeekerApplicationItem } from '@/modules/seeker/applications/types/application.types';

interface ApplicationApiItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId?: string | null;
  companyName: string;
  companyLogoUrl?: string | null;
  salaryRange: string;
  jobType: string;
  workType: string | null;
  experienceLevel: string | null;
  companyIndustry: string | null;
  companySize: string | null;
  companyFundingType: string | null;
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

  generateResume: async (applicationId: string): Promise<void> => {
    await apiClient.post(`/applications/${applicationId}/generate`);
  },

  getMyApplications: async (): Promise<SeekerApplicationItem[]> => {
    const { data } = await apiClient.get<ApplicationApiItem[]>('/applications');
    return data.map((application) => ({
      ...application,
      companyLogoUrl: application.companyLogoUrl ?? undefined,
      salaryRange: application.salaryRange,
      jobType: application.jobType,
      workType: application.workType,
      experienceLevel: application.experienceLevel,
      companyIndustry: application.companyIndustry,
      companySize: application.companySize,
      companyFundingType: application.companyFundingType,
      skills: application.skills,
      pipelineStage: application.pipelineStage as SeekerApplicationItem['pipelineStage'],
      appliedAt: format(new Date(application.appliedAt), 'MMM d, yyyy'),
    }));
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
