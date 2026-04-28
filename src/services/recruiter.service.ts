import { apiClient } from '@/lib/axios';
import type { ApplicationStatus, InterviewStatus, JobStatus, PlanTier } from '@/constants/enums';
import type { JdGeneratorInput } from '@/lib/validations/jd-generator.schema';
import type {
  RecruiterProfileSettingsInput,
  ScheduleInterviewInput,
} from '@/lib/validations/interview.schema';
import type { DashboardData } from '@/modules/recruiter/dashboard/types/dashboard.types';
import type { JobAnalyticsResponse } from '@/modules/recruiter/jobs/types/analytics.types';

interface DataResponse<T> {
  data: T;
}

interface UpdateApplicationStageResponse {
  id: string;
  status: ApplicationStatus;
  updatedAt: string;
  notificationSent: boolean;
}

export interface ActiveJob {
  id: string;
  title: string;
  status: string;
  _count: { applications: number };
  createdAt: string;
}

export interface UpcomingInterviewItem {
  id: string;
  startsAt: string;
  meetLink: string | null;
  application: {
    job: { title: string };
    seeker: { name: string | null };
  };
}

export interface RecruiterSettingsData {
  name: string;
  email: string;
  image: string | null;
  plan: PlanTier;
  billingCustomerId: string | null;
  companyName: string;
  bio: string;
  companySize: string;
  industry: string;
  fundingType: string;
  isFullyRemote: boolean;
  website: string;
  logo: string | null;
  emailNotifications: boolean;
  applicationAlerts: boolean;
  interviewNotifications: boolean;
}

export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string | null;
  primaryRole: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  candidateProfile: {
    primaryRole: string | null;
    headline: string | null;
    location: string | null;
    skills: string[];
  };
  matchScore: number;
  status: ApplicationStatus;
  plan: PlanTier;
  coverLetter: string | null;
  resumeUrl: string | null;
  appliedAt: string;
  scheduledInterview: {
    id: string;
    status: InterviewStatus;
    startsAt: string | null;
    endsAt: string | null;
    meetLink: string | null;
    notes: string | null;
  } | null;
}

export interface RecruiterApplicationsParams {
  cursor?: string | null;
  stage?: ApplicationStatus | null;
  search?: string;
  jobId?: string;
  limit?: number;
}

export interface RecruiterApplicationsResponse {
  applications: CandidateApplication[];
  meta: {
    recruiterPlan: PlanTier;
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface RecruiterStatsResponse {
  total: number;
  applied: number;
  reviewing: number;
  interview: number;
  hired: number;
}

export interface AiSummaryResult {
  summary: string;
}

export interface InterviewPayload {
  applicationId?: string;
  startsAt: string;
  endsAt: string;
  meetLink: string;
  notes: string;
}

export const recruiterService = {
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await apiClient.get<DataResponse<DashboardData>>('/recruiter/dashboard');
    return data.data;
  },

  getActiveJobs: async (): Promise<ActiveJob[]> => {
    const { data } = await apiClient.get<{ jobs: ActiveJob[] }>('/recruiter/jobs');
    return data.jobs ?? [];
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiClient.delete(`/recruiter/jobs/${id}`);
  },

  updateJobStatus: async (id: string, status: JobStatus.OPEN | JobStatus.PAUSED): Promise<void> => {
    await apiClient.patch(`/recruiter/jobs/${id}`, { status });
  },

  getJobAnalytics: async (jobId: string): Promise<JobAnalyticsResponse> => {
    const { data } = await apiClient.get<DataResponse<JobAnalyticsResponse>>(`/recruiter/jobs/${jobId}/analytics`);
    return data.data;
  },

  getSettings: async (): Promise<DataResponse<RecruiterSettingsData>> => {
    const { data } = await apiClient.get<DataResponse<RecruiterSettingsData>>('/recruiter/settings');
    return data;
  },

  updateSettings: async (payload: RecruiterProfileSettingsInput): Promise<void> => {
    await apiClient.patch('/recruiter/settings', payload);
  },

  updateNotificationSettings: async (payload: {
    emailNotifications: boolean;
    applicationAlerts: boolean;
    interviewNotifications: boolean;
  }): Promise<void> => {
    await apiClient.patch('/recruiter/settings', payload);
  },

  suggestSkills: async (descriptionText: string): Promise<string[]> => {
    const { data } = await apiClient.post<DataResponse<{ skills: string[] }>>('/recruiter/ai/suggest-skills', {
      descriptionText,
    });
    return data.data.skills;
  },

  generateJobDescription: async (payload: JdGeneratorInput): Promise<string> => {
    const { data } = await apiClient.post<string>('/recruiter/ai/generate-jd', payload, {
      responseType: 'text',
      transformResponse: [(value: string) => value],
    });
    return data;
  },

  getApplicationStats: async (jobId?: string): Promise<RecruiterStatsResponse> => {
    const { data } = await apiClient.get<RecruiterStatsResponse>('/recruiter/applications/stats', {
      params: jobId ? { jobId } : undefined,
    });
    return data;
  },

  getApplications: async (params: RecruiterApplicationsParams): Promise<RecruiterApplicationsResponse> => {
    const { data } = await apiClient.get<RecruiterApplicationsResponse>('/recruiter/applications', {
      params,
    });
    return data;
  },

  scheduleInterview: async (payload: ScheduleInterviewInput): Promise<void> => {
    await apiClient.post('/recruiter/interviews', payload);
  },

  rescheduleInterview: async (interviewId: string, payload: InterviewPayload): Promise<void> => {
    await apiClient.patch(`/recruiter/interviews/${interviewId}`, payload);
  },

  getUpcomingInterviews: async (): Promise<DataResponse<UpcomingInterviewItem[]>> => {
    const { data } = await apiClient.get<DataResponse<UpcomingInterviewItem[]>>('/recruiter/interviews/upcoming');
    return data;
  },

  cancelInterview: async (interviewId: string): Promise<void> => {
    await apiClient.patch(`/recruiter/interviews/${interviewId}/cancel`);
  },

  updateApplicationStage: async (
    applicationId: string,
    stage: ApplicationStatus,
  ): Promise<{ status: ApplicationStatus; updatedAt: string }> => {
    const { data } = await apiClient.patch<DataResponse<UpdateApplicationStageResponse>>(
      `/recruiter/applications/${applicationId}/stage`,
      { stage },
    );
    return data.data;
  },

  generateApplicationAiSummary: async (applicationId: string): Promise<AiSummaryResult> => {
    try {
      const { data } = await apiClient.post<DataResponse<AiSummaryResult>>(
        `/recruiter/applications/${applicationId}/ai-summary`,
      );
      return data.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('AI candidate summaries require')) {
        throw new Error('PLAN_GATED');
      }
      throw error;
    }
  },
};
