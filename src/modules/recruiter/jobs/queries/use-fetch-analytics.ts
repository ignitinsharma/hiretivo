'use client';

import { useQuery } from '@tanstack/react-query';
import type { JobAnalyticsResponse } from '@/modules/recruiter/jobs/types/analytics.types';

async function fetchAnalytics(jobId: string): Promise<JobAnalyticsResponse> {
  const res = await fetch(`/api/recruiter/jobs/${jobId}/analytics`);
  if (!res.ok) throw new Error('Failed to load analytics');
  const json = (await res.json()) as { data: JobAnalyticsResponse };
  return json.data;
}

export function useFetchAnalytics(jobId: string) {
  return useQuery({
    queryKey: ['job-analytics', jobId],
    queryFn: () => fetchAnalytics(jobId),
    staleTime: 5 * 60 * 1000, // analytics are computed server-side, fine to cache 5 min
    enabled: !!jobId,
  });
}
