export interface ProfileStrengthSummary {
  percentage: number;
  completedCount: number;
  totalCount: number;
  nextMissingField: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
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
  profileStrength: ProfileStrengthSummary;
  quickStats: QuickStatsSummary;
  skillGap: SkillGapSummary;
  digest: DigestPreferenceSummary;
}