import { ApplicationStatus } from '@/constants/enums';

export interface SeekerApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl?: string;
  status: ApplicationStatus;
  appliedAt: string;
}