import { apiClient } from '@/lib/axios';
import type { SeekerSettingsInput } from '@/lib/validations/seeker.schema';
import type { CertificationInput } from '@/lib/validations/certification.schema';
import type { ApplicationDefaultsInput } from '@/lib/validations/application-defaults.schema';
import type { ProjectInput } from '@/lib/validations/project.schema';
import type { OptimizeMode } from '@/constants/enums';
import type { JobDetailResponse, JobListItem } from '@/modules/jobs/types/job.types';
import type { FeedFilters } from '@/modules/seeker/feed/types/feed.types';
import type { ProfileStrengthSummary } from '@/modules/seeker/dashboard/types/dashboard.types';
import type { ApplicationDetail, SubmittedFormField, ApplyKeywordStats } from '@/modules/seeker/apply/types/apply.types';
import type { DashboardApplicationSummary } from '@/modules/seeker/dashboard/types/applications-table.types';
import type { ResumeDocument } from '@/modules/seeker/profile/types/resume-document.types';
import type { ResumeOptimizeRequest, CoverLetterRequest } from '@/lib/validations/apply-ai.schema';

interface DataResponse<T> {
  data: T;
}

export interface CertificationItem extends CertificationInput {
  id: string;
}

export interface WorkExperienceItem {
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

export interface EducationItem {
  id: string;
  institution: string;
  graduationDate: string | null;
  degree: string | null;
  major: string | null;
}

export interface SeekerFeedResponse {
  jobs: JobListItem[];
  nextCursor: string | null;
  totalCount?: number;
  remainingCount?: number;
  hasMoreRecent?: boolean;
}

export interface SeekerSettingsData {
  name: string;
  email: string;
  image: string | null;
  headline: string;
  bio: string;
  location: string | null;    // raw stored value — kept for recruiter display
  city: string | null;        // derived by GET endpoint via parseLegacyLocation
  state: string | null;       // derived by GET endpoint via parseLegacyLocation
  situation: string;
  primaryRole: string;
  workPreference: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  availability: string;
  resumeKey: string | null;
  skills: Array<{ id: string; name: string; slug: string }>;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  yearsExperience: number | null;
  profileStrength: ProfileStrengthSummary;
  workExperiences: WorkExperienceItem[];
  educations: EducationItem[];
}

export const seekerService = {
  getFeed: async (
    params?: { cursor?: string; limit?: number } & Partial<FeedFilters>,
  ): Promise<SeekerFeedResponse> => {
    const { companies, ...rest } = params ?? {};
    const query = { ...rest, companies: companies?.length ? companies.join(',') : undefined };
    const { data } = await apiClient.get<SeekerFeedResponse>('/seeker/feed', { params: query });
    return data;
  },

  updateDigestPreference: async (enabled: boolean): Promise<void> => {
    await apiClient.patch('/seeker/digest', { enabled });
  },

  dismissJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`/seeker/dismissed-jobs/${jobId}`);
  },

  getSettings: async (): Promise<DataResponse<SeekerSettingsData>> => {
    const { data } = await apiClient.get<DataResponse<SeekerSettingsData>>('/seeker/settings');
    return data;
  },

  updateSettings: async (payload: Partial<SeekerSettingsInput>): Promise<void> => {
    await apiClient.patch('/seeker/settings', payload);
  },

  /* getJobDetail — reuses the public GET /api/jobs/[id] endpoint (already auth-aware for match data). */
  getJobDetail: async (jobId: string): Promise<JobDetailResponse> => {
    const { data } = await apiClient.get<JobDetailResponse>(`/jobs/${jobId}`);
    return data;
  },

  getCertifications: async (): Promise<DataResponse<{ certifications: CertificationItem[] }>> => {
    const { data } = await apiClient.get<DataResponse<{ certifications: CertificationItem[] }>>(
      '/seeker/certifications',
    );
    return data;
  },

  updateCertifications: async (certifications: CertificationInput[]): Promise<void> => {
    await apiClient.put('/seeker/certifications', { certifications });
  },

  getApplicationDefaults: async (): Promise<DataResponse<ApplicationDefaultsInput | null>> => {
    const { data } = await apiClient.get<DataResponse<ApplicationDefaultsInput | null>>(
      '/seeker/application-defaults',
    );
    return data;
  },

  updateApplicationDefaults: async (payload: ApplicationDefaultsInput): Promise<void> => {
    await apiClient.put('/seeker/application-defaults', payload);
  },

  getProjects: async (): Promise<DataResponse<{ projects: ProjectInput[] }>> => {
    const { data } = await apiClient.get<DataResponse<{ projects: ProjectInput[] }>>('/seeker/projects');
    return data;
  },

  updateProjects: async (projects: ProjectInput[]): Promise<void> => {
    await apiClient.put('/seeker/projects', { projects });
  },

  getOptimizeMode: async (): Promise<DataResponse<{ optimizeMode: OptimizeMode }>> => {
    const { data } = await apiClient.get<DataResponse<{ optimizeMode: OptimizeMode }>>('/seeker/optimize-mode');
    return data;
  },

  updateOptimizeMode: async (optimizeMode: OptimizeMode): Promise<void> => {
    await apiClient.patch('/seeker/optimize-mode', { optimizeMode });
  },

  getCreditStatus: async (): Promise<DataResponse<{ remaining: number; limit: number }>> => {
    const { data } = await apiClient.get<DataResponse<{ remaining: number; limit: number }>>('/seeker/credits');
    return data;
  },

  createApplication: async (jobId: string): Promise<DataResponse<{ id: string }>> => {
    const { data } = await apiClient.post<DataResponse<{ id: string }>>('/seeker/applications', { jobId });
    return data;
  },

  /* GET /api/seeker/applications — full list backing the /dashboard applications
   * table and the /dashboard/tracker kanban (Applications + passed/DismissedJob rows). */
  getMyDashboardApplications: async (): Promise<DataResponse<DashboardApplicationSummary[]>> => {
    const { data } = await apiClient.get<DataResponse<DashboardApplicationSummary[]>>('/seeker/applications');
    return data;
  },

  /* POST /api/seeker/apply/from-link — either a new PASTED_LINK Application
   * id, or needsManualPaste:true asking the caller to re-submit with pastedText. */
  applyFromLink: async (
    input: { url: string; pastedText?: string },
  ): Promise<DataResponse<{ applicationId: string }> | { needsManualPaste: true; reason: string }> => {
    const { data } = await apiClient.post<
      DataResponse<{ applicationId: string }> | { needsManualPaste: true; reason: string }
    >('/seeker/apply/from-link', input);
    return data;
  },

  getApplication: async (id: string): Promise<DataResponse<ApplicationDetail>> => {
    const { data } = await apiClient.get<DataResponse<ApplicationDetail>>(`/seeker/applications/${id}`);
    return data;
  },

  updateApplication: async (
    id: string,
    payload: Partial<{
      tailoredResumeKey: string;
      coverLetter: string;
      submittedFormData: SubmittedFormField[];
      keywordStats: ApplyKeywordStats;
      status: string;
    }>,
  ): Promise<void> => {
    await apiClient.patch(`/seeker/applications/${id}`, payload);
  },

  /* finalizeApplication — `resume` is required only the first call (before a
   * PDF exists); `submittedFormData` is what actually confirms submission and
   * can arrive in a later, separate call (Section D5 Approve-all) against an
   * already-rendered row. See the route's doc comment for the full contract. */
  finalizeApplication: async (
    id: string,
    payload: Partial<{ resume: unknown; coverLetter: string; submittedFormData: SubmittedFormField[] }>,
  ): Promise<DataResponse<{ tailoredResumeUrl: string | null }>> => {
    const { data } = await apiClient.post<DataResponse<{ tailoredResumeUrl: string }>>(
      `/seeker/applications/${id}/finalize`,
      payload,
    );
    return data;
  },

  /* optimizeResume — response is a single-chunk text/plain ResumeDocument
   * JSON body (not {data}-wrapped) plus an X-Reservation-Handle header. */
  optimizeResume: async (
    payload: ResumeOptimizeRequest,
  ): Promise<{ resume: ResumeDocument; reservationHandle: string | null }> => {
    const res = await apiClient.post<string>('/seeker/apply/optimize-resume', payload, {
      responseType: 'text',
    });
    return {
      resume: JSON.parse(res.data) as ResumeDocument,
      reservationHandle: (res.headers['x-reservation-handle'] as string | undefined) ?? null,
    };
  },

  generateCoverLetter: async (payload: CoverLetterRequest): Promise<{ coverLetter: string }> => {
    const { data } = await apiClient.post<DataResponse<{ coverLetter: string }>>(
      '/seeker/apply/cover-letter',
      payload,
    );
    return data.data;
  },
};
