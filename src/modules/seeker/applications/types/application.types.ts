import { ApplicationStatus, JobStatus } from '@/constants/enums';

export interface SeekerApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  jobStatus?: JobStatus;
  companyId?: string | null;
  companyName: string;
  companyLogoUrl?: string;
  salaryRange?: string;
  jobType?: string;
  workType?: string | null;
  experienceLevel?: string | null;
  companyIndustry?: string | null;
  companySize?: string | null;
  companyFundingType?: string | null;
  skills?: string[];
  status: ApplicationStatus;
  appliedAt: string;
}
