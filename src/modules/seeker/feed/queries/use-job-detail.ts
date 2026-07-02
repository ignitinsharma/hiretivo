'use client';
import { useQuery } from '@tanstack/react-query';
import { seekerService } from '@/services/seeker.service';
import type { JobDetailResponse } from '@/modules/jobs/types/job.types';

/* useJobDetail
 * Fetches full job detail (incl. match breakdown) for the feed's detail drawer.
 * @param jobId - job id, or null when the drawer is closed
 * @returns useQuery result over JobDetailResponse, disabled when jobId is null */
export function useJobDetail(jobId: string | null) {
  return useQuery<JobDetailResponse>({
    queryKey: ['job-detail', jobId],
    queryFn: () => seekerService.getJobDetail(jobId as string),
    enabled: !!jobId,
    staleTime: 5 * 60_000,
  });
}
