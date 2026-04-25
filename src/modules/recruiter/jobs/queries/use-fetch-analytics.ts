'use client';

import { useQuery } from '@tanstack/react-query';
import { recruiterService } from '@/services/recruiter.service';

export function useFetchAnalytics(jobId: string) {
  return useQuery({
    queryKey: ['job-analytics', jobId],
    queryFn: () => recruiterService.getJobAnalytics(jobId),
    staleTime: 5 * 60 * 1000, // analytics are computed server-side, fine to cache 5 min
    enabled: !!jobId,
  });
}
