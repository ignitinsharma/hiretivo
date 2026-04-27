'use client';

import { useQuery } from '@tanstack/react-query';
import { seekerService } from '@/services/seeker.service';

const QUERY_KEY = ['seeker-interviews'] as const;

export function useFetchSeekerInterviews() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: seekerService.getUpcomingInterviews,
    staleTime: 30_000,
  });
}
