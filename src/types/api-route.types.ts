import type { Role, PlanTier, AppStatus, JobType, WorkType, JobStatus } from "@prisma/client";
import type { Session } from "next-auth";

export interface SessionUser {
  id: string;
  role: Role;
  plan: PlanTier;
  emailVerified: Date | null;
  onboardingCompleted: boolean | null;
  onboardingStep: number | null;
  isAdmin: boolean;
}

export interface AuthSession extends Session {
  user: SessionUser & {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export interface DeleteAccountResponse {
  data?: {
    success: boolean;
  };
  error?: string;
}

export interface ChangePasswordResponse {
  data?: {
    success: boolean;
  };
  error?: string | Record<string, unknown>;
}

export interface BillingCustomer {
  billingCustomerId: string | null;
}

export interface BillingSubscription {
  id: string;
  status: string;
  customerId: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string | Record<string, unknown>;
};

export type ApiErrorResponse = {
  error: string;
  status: number;
};

export interface JobSkill {
  skillId: string;
  level: string;
}

export interface JobListItem {
  id: string;
  title: string;
  description: string;
  jobType: JobType;
  applyType: string;
  workType: WorkType | null;
  status: JobStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  externalApplyUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  skills: Array<{
    skill: {
      id: string;
      name: string;
    };
    level: string;
  }>;
  _count?: {
    applications: number;
  };
}

export interface ApplicationListItem {
  id: string;
  jobId: string;
  status: AppStatus;
  createdAt: Date;
  matchScore: number;
  coverLetter: string | null;
  job: {
    title: string;
    companyName: string | null;
    companyLogoUrl: string | null;
  };
}

export interface SeekerProfile {
  id: string;
  userId: string;
  primaryRole: string | null;
  headline: string | null;
  summary: string | null;
  experienceYears: number | null;
  currentSalary: number | null;
  desiredSalary: number | null;
  resumeUrl: string | null;
  resumeFileName: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
