/** Seeker dashboard data contracts — consumed by UI components and API. */

export interface QuickStatsSummary {
  applied: number;
  activeApplications: number;
  interviews: number;
}

export interface SkillGapItem {
  skillName: string;
  frequency: number;
}

export interface SkillGapSummary {
  items: SkillGapItem[];
  total: number;
}

export interface DigestPreferenceSummary {
  enabled: boolean;
}

export interface VerificationSummary {
  status: string;
  verificationNotes: string | null;
}

export interface SeekerDashboardData {
  greetingName: string | null;
  quickStats: QuickStatsSummary;
  skillGap: SkillGapSummary;
  digest: DigestPreferenceSummary;
  verification: VerificationSummary;
}

export interface SeekerInterview {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  meetLink: string | null;
  notes: string | null;
  status: string;
  jobTitle: string;
  companyName: string;
  interviewerName: string;
  scheduledTimeZone: string | null;
  viewerTimezone: string | null;
}
