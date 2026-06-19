import { apiClient } from "@/lib/axios";
import type { AiSummaryData } from "@/lib/ai-prompts";
import type {
  ApplicationStatus,
  InterviewStatus,
  JobStatus,
  PlanTier,
  VerificationStatus,
} from "@/constants/enums";
import type { JdGeneratorInput } from "@/lib/validations/jd-generator.schema";
import type {
  RecruiterProfileSettingsInput,
  ScheduleInterviewInput,
} from "@/lib/validations/interview.schema";
import type { DashboardData } from "@/modules/recruiter/dashboard/types/dashboard.types";
import type { JobAnalyticsResponse } from "@/modules/recruiter/jobs/types/analytics.types";
import type {
  TalentDetail,
  TalentListResponse,
} from "@/modules/recruiter/talent/types/talent.types";

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
  scheduledTimeZone: string | null;
  application: {
    job: { title: string };
    seeker: { name: string | null };
  };
}

export interface RecruiterSettingsData {
  name: string;
  email: string;
  isEmailVerified: boolean;
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

export interface CandidateWorkExperience {
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

export interface CandidateEducation {
  id: string;
  institution: string;
  graduationDate: string | null;
  degree: string | null;
  major: string | null;
}

export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  jobSkills: string[];
  candidateName: string;
  candidateEmail: string;
  candidateAvatar: string | null;
  /** Hiretivo verification state — drives the verified badge on recruiter surfaces. */
  verificationStatus: VerificationStatus;
  primaryRole: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  candidateProfile: {
    primaryRole: string | null;
    headline: string | null;
    location: string | null;
    skills: string[];
    yearsExperience: number | null;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    twitterUrl: string | null;
    videoIntroUrl: string | null;
    workExperiences: CandidateWorkExperience[];
    educations: CandidateEducation[];
  };
  matchScore: number;
  status: ApplicationStatus;
  plan: PlanTier;
  /** FREE plan: true when applicant is beyond the visible 5/job window (PII redacted server-side). */
  locked: boolean;
  canScheduleInterviews: boolean;
  canUseAi: boolean;
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
    scheduledTimeZone: string | null;
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
    lockedCount: number;
  };
}

export interface RecruiterStatsResponse {
  total: number;
  applied: number;
  reviewing: number;
  interview: number;
  hired: number;
}

export interface RecruiterTalentParams {
  q?: string;
  skill?: string;
  location?: string;
  availability?: string;
  page?: number;
  limit?: number;
}

export type FitLevel = "excellent" | "good" | "moderate" | "low";

export type { AiSummaryData };

/* Structured AI candidate insights returned to the drawer: section strings + deterministic fit scoring. */
export interface AiSummaryResult extends AiSummaryData {
  fitScore: number;
  fitLevel: FitLevel;
}

/* Tiered AI skill suggestions: core = must-have, secondary = nice-to-have. */
export interface SuggestedSkills {
  core: string[];
  secondary: string[];
}

export interface InterviewPayload {
  applicationId?: string;
  startsAt: string;
  endsAt: string;
  meetLink: string;
  notes: string;
  scheduledTimeZone?: string;
}

export class TalentForbiddenError extends Error {
  constructor() {
    super("Talent pool requires a paid recruiter plan.");
    this.name = "TalentForbiddenError";
  }
}

/**
 * Detects 403 failures after axios normalizes the original response.
 */
function isForbiddenRequestError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("403");
}

export const recruiterService = {
  getDashboard: async (): Promise<DashboardData> => {
    const { data } = await apiClient.get<DataResponse<DashboardData>>(
      "/recruiter/dashboard",
    );
    return data.data;
  },

  getActiveJobs: async (): Promise<ActiveJob[]> => {
    const { data } = await apiClient.get<{ jobs: ActiveJob[] }>(
      "/recruiter/jobs",
    );
    return data.jobs ?? [];
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiClient.delete(`/recruiter/jobs/${id}`);
  },

  updateJobStatus: async (
    id: string,
    status: JobStatus.OPEN | JobStatus.PAUSED,
  ): Promise<void> => {
    await apiClient.patch(`/recruiter/jobs/${id}`, { status });
  },

  getJobAnalytics: async (jobId: string): Promise<JobAnalyticsResponse> => {
    const { data } = await apiClient.get<DataResponse<JobAnalyticsResponse>>(
      `/recruiter/jobs/${jobId}/analytics`,
    );
    return data.data;
  },

  getSettings: async (): Promise<DataResponse<RecruiterSettingsData>> => {
    const { data } = await apiClient.get<DataResponse<RecruiterSettingsData>>(
      "/recruiter/settings",
    );
    return data;
  },

  updateSettings: async (
    payload: RecruiterProfileSettingsInput,
  ): Promise<void> => {
    await apiClient.patch("/recruiter/settings", payload);
  },

  updateNotificationSettings: async (payload: {
    emailNotifications: boolean;
    applicationAlerts: boolean;
    interviewNotifications: boolean;
  }): Promise<void> => {
    await apiClient.patch("/recruiter/settings", payload);
  },

  suggestSkills: async (descriptionText: string): Promise<SuggestedSkills> => {
    const { data } = await apiClient.post<
      DataResponse<{ skills: SuggestedSkills }>
    >("/recruiter/ai/suggest-skills", {
      descriptionText,
    });
    return data.data.skills;
  },

  async *generateJobDescription(
    payload: JdGeneratorInput,
  ): AsyncGenerator<string> {
    const res = await fetch("/api/recruiter/ai/generate-jd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Failed to generate JD." }));
      throw new Error(
        (err as { error?: string }).error ?? "Failed to generate JD.",
      );
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  },

  getApplicationStats: async (
    jobId?: string,
  ): Promise<RecruiterStatsResponse> => {
    const { data } = await apiClient.get<RecruiterStatsResponse>(
      "/recruiter/applications/stats",
      {
        params: jobId ? { jobId } : undefined,
      },
    );
    return data;
  },

  getTalent: async (
    params: RecruiterTalentParams,
  ): Promise<TalentListResponse["data"]> => {
    // FREE plan now returns 200 with blurred items + isFreePlan:true (no longer 403).
    // TalentForbiddenError 403 path is dead code for getTalent — removed.
    const { data } = await apiClient.get<TalentListResponse>(
      "/recruiter/talent",
      {
        params,
      },
    );
    return data.data;
  },

  getTalentDetail: async (seekerId: string): Promise<TalentDetail> => {
    try {
      const { data } = await apiClient.get<DataResponse<TalentDetail>>(
        `/recruiter/talent/${seekerId}`,
      );
      return data.data;
    } catch (error) {
      if (isForbiddenRequestError(error)) {
        throw new TalentForbiddenError();
      }

      throw error;
    }
  },

  getApplications: async (
    params: RecruiterApplicationsParams,
  ): Promise<RecruiterApplicationsResponse> => {
    const { data } = await apiClient.get<RecruiterApplicationsResponse>(
      "/recruiter/applications",
      {
        params,
      },
    );
    return data;
  },

  scheduleInterview: async (payload: ScheduleInterviewInput): Promise<void> => {
    await apiClient.post("/recruiter/interviews", payload);
  },

  rescheduleInterview: async (
    interviewId: string,
    payload: InterviewPayload,
  ): Promise<void> => {
    await apiClient.patch(`/recruiter/interviews/${interviewId}`, payload);
  },

  getUpcomingInterviews: async (): Promise<
    DataResponse<UpcomingInterviewItem[]>
  > => {
    const { data } = await apiClient.get<DataResponse<UpcomingInterviewItem[]>>(
      "/recruiter/interviews/upcoming",
    );
    return data;
  },

  cancelInterview: async (interviewId: string): Promise<void> => {
    await apiClient.patch(`/recruiter/interviews/${interviewId}/cancel`);
  },

  updateApplicationStage: async (
    applicationId: string,
    stage: ApplicationStatus,
  ): Promise<{ status: ApplicationStatus; updatedAt: string }> => {
    const { data } = await apiClient.patch<
      DataResponse<UpdateApplicationStageResponse>
    >(`/recruiter/applications/${applicationId}/stage`, { stage });
    return data.data;
  },

  generateApplicationAiSummary: async (
    applicationId: string,
  ): Promise<AiSummaryResult> => {
    try {
      const { data } = await apiClient.post<DataResponse<AiSummaryResult>>(
        `/recruiter/applications/${applicationId}/ai-summary`,
      );
      return data.data;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("AI candidate summaries require")
      ) {
        throw new Error("PLAN_GATED");
      }
      throw error;
    }
  },
};
