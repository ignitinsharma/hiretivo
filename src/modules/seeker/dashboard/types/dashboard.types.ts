/** Seeker dashboard data contracts — consumed by UI components and API. */

export interface ProfileStrengthSummary {
  percentage: number;
  completedCount: number;
  totalFields: number;
  nextMissingField: string | null;
  ctaLabel: string;
  ctaHref: string;
}

export interface QuickStatsSummary {
  applied: number;
  viewed: number;
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

export interface SeekerDashboardData {
  greetingName: string | null;
  profileStrength: ProfileStrengthSummary;
  quickStats: QuickStatsSummary;
  skillGap: SkillGapSummary;
  digest: DigestPreferenceSummary;
}
