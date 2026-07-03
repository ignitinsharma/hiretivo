'use client';
import { useQuery } from '@tanstack/react-query';
import { seekerService } from '@/services/seeker.service';
import type { ApplicationDetail } from '@/modules/seeker/apply/types/apply.types';

/* applicationQueryKey — stable TanStack key for one application record. */
export function applicationQueryKey(id: string): ['application', string] {
  return ['application', id];
}

/* useApplication
 * Fetches the apply-wizard's target Application record (job/JD context plus
 * any previously saved artifacts).
 * @param id - application id from the wizard route
 * @returns useQuery result over ApplicationDetail */
export function useApplication(id: string) {
  return useQuery<ApplicationDetail>({
    queryKey: applicationQueryKey(id),
    queryFn: async () => (await seekerService.getApplication(id)).data,
    staleTime: 30_000,
  });
}
