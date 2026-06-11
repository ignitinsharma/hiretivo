import type { ApplicationStatus, VerificationStatus } from '@/constants/enums';

export interface DashboardStats {
  activeJobsCount: number;
  totalApplications: number;
  newThisWeek: number;
  avgMatchScore: number;
}

export interface RecentApplicant {
  id: string;
  seekerName: string;
  seekerImage: string | null;
  /** Hiretivo verification state — drives the verified badge. */
  verificationStatus: VerificationStatus;
  jobTitle: string;
  matchScore: number;
  status: ApplicationStatus;
  appliedDate: string;
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface DashboardData {
  activeJobsCount: number;
  totalApplications: number;
  newThisWeek: number;
  avgMatchScore: number;
  recentApplicants: RecentApplicant[];
  trendData: TrendDataPoint[];
}