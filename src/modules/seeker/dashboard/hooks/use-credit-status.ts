import { useQuery } from '@tanstack/react-query';
import { seekerService } from '@/services/seeker.service';

export const creditStatusQueryKey = ['seeker-credit-status'] as const;

/*
 * useCreditStatus
 * Live monthly AI-credit remaining/limit for the current seeker (GET
 * /api/seeker/credits). Shared by CreditsBanner and the sidebar widget so
 * both read the same cache and never disagree.
 */
export function useCreditStatus() {
  return useQuery({
    queryKey: creditStatusQueryKey,
    queryFn: async () => (await seekerService.getCreditStatus()).data,
    staleTime: 30_000,
  });
}
