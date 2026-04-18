export interface ViewTrendPoint {
  date: string; // 'YYYY-MM-DD' — day bucket
  views: number;
}

export interface JobAnalyticsResponse {
  viewCount: number; // total views all time
  applyRate: number; // (applicationCount / viewCount) * 100, 0 if viewCount = 0
  avgMatchScore: number; // average Application.matchScore, 0 if no applications
  topSkills: string[]; // top 5 skill names by frequency among applicants, sorted desc
  viewTrend: ViewTrendPoint[]; // last 30 days, one point per calendar day (filled with 0s for empty days)
}
