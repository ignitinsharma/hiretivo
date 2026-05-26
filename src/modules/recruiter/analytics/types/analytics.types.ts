/*
 * FunnelStage
 * One stage of the hiring funnel: stage key, display label, count, and
 * conversion % relative to the previous stage (null for the first stage).
 */
export interface FunnelStage {
  key: 'unlocked' | 'applied' | 'reviewing' | 'interview' | 'offer' | 'hired';
  label: string;
  count: number;
  conversionPct: number | null; // null = no previous stage OR previous count was 0
}

/*
 * RecruiterAnalyticsResponse
 * Full payload for GET /api/recruiter/analytics.
 * funnel: 6 ordered stages. creditsUsed/creditsRemaining/totalQuota: null = unlimited (SCALE).
 * topSkills: up to 5 most frequent skill names across unlocked engineers.
 */
export interface RecruiterAnalyticsResponse {
  funnel: FunnelStage[];
  creditsUsed: number;
  creditsRemaining: number | null;
  totalQuota: number | null;
  topSkills: string[];
}
