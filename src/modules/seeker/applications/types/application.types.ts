import { ApplicationStatus, AutomationStatus, JobStatus, PipelineStage } from '@/constants/enums';

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
  automationStatus?: AutomationStatus | null;
  failureReason?: string | null;
  pipelineStage?: PipelineStage;
  skills?: string[];
  matchedSkillNames?: string[];
  missingSkills?: string[];
  description?: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  createdAt?: string | null;
}
