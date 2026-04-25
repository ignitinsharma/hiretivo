import { apiClient } from '@/lib/axios';
import type { CreateApplicationInput } from '@/lib/validations/application';
import type { SeekerApplicationItem } from '@/modules/seeker/applications/types/application.types';

interface ApplicationApiItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl?: string | null;
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
      appliedAt: new Date(application.appliedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  },
};
