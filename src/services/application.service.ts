import { apiClient } from '@/lib/axios';
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
  minYearsExperience: number | null;
  companyIndustry: string | null;
  companySize: string | null;
  companyFundingType: string | null;
  skills: string[];
  source?: string;
  status: SeekerApplicationItem['status'];
  appliedAt: string;
}

export const applicationService = {
  applyToJob: async (payload: CreateApplicationInput): Promise<void> => {
    await apiClient.post('/applications', payload);
  },

  getMyApplications: async (): Promise<SeekerApplicationItem[]> => {
    const { data } = await apiClient.get<ApplicationApiItem[]>('/applications');
    return data.map((application) => ({
      ...application,
      companyLogoUrl: application.companyLogoUrl ?? undefined,
      salaryRange: application.salaryRange,
      jobType: application.jobType,
      workType: application.workType,
      minYearsExperience: application.minYearsExperience,
      companyIndustry: application.companyIndustry,
      companySize: application.companySize,
      companyFundingType: application.companyFundingType,
      skills: application.skills,
      source: application.source,
      appliedAt: new Date(application.appliedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  },
};
