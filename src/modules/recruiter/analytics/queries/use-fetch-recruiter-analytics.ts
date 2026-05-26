'use client';

import { useQuery } from '@tanstack/react-query';
import type { RecruiterAnalyticsResponse } from '@/modules/recruiter/analytics/types/analytics.types';

/*
 * useRecruiterAnalytics
 * Fetches GET /api/recruiter/analytics (funnel, credits, top skills).
 * @param enabled - pass false for FREE plan to avoid firing the request (prevents wasted/403 call)
 * @returns TanStack Query result with RecruiterAnalyticsResponse data
 */
export function useRecruiterAnalytics(enabled = true) {
  return useQuery({
    queryKey: ['recruiter-analytics'],
    queryFn: async (): Promise<RecruiterAnalyticsResponse> => {
      const res = await fetch('/api/recruiter/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const json = await res.json();
      return json.data as RecruiterAnalyticsResponse;
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
