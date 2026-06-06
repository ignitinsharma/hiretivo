'use client';

import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';

import {
  recruiterService,
  TalentForbiddenError,
  type RecruiterTalentParams,
} from '@/services/recruiter.service';
import type { TalentDetail } from '@/modules/recruiter/talent/types/talent.types';

export interface TalentFilters {
  q: string;
}

const TALENT_QUERY_KEY = 'recruiter-talent';

/*
 * PAGE_LIMIT
 * Candidates fetched per page. Matches backend DEFAULT_LIMIT.
 * Changing this here is enough — no backend change needed.
 */
const PAGE_LIMIT = 12;

/*
 * useFetchTalent
 * Fetches the paid recruiter Talent Pool list with infinite Load More pagination.
 * Data lives in data.pages[n] — flatten with pages.flatMap(p => p.items) in consumers.
 * Query key includes filters — any filter change resets to page 1 automatically.
 * FREE plan: getNextPageParam returns undefined (no pagination for blurred grid).
 * @param filters - Current search/filter state
 */
export function useFetchTalent(filters: TalentFilters) {
  return useInfiniteQuery({
    queryKey: [TALENT_QUERY_KEY, filters],
    queryFn: ({ pageParam }) => {
      const params: RecruiterTalentParams = {
        page: pageParam,
        limit: PAGE_LIMIT,
      };
      if (filters.q.trim()) params.q = filters.q.trim();
      return recruiterService.getTalent(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // FREE plan returns isFreePlan:true — no pagination for blurred grid.
      if (lastPage.isFreePlan) return undefined;
      const fetched = lastPage.page * lastPage.limit;
      return fetched < lastPage.total ? lastPage.page + 1 : undefined;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/*
 * useFetchTalentDetail
 * Fetches one expanded Talent Pool candidate profile.
 * Unchanged — used by TalentProfileDialog.
 * @param seekerId - Seeker ID or null (query disabled when null)
 */
export function useFetchTalentDetail(seekerId: string | null) {
  return useQuery({
    queryKey: [TALENT_QUERY_KEY, 'detail', seekerId],
    enabled: Boolean(seekerId),
    queryFn: async (): Promise<TalentDetail> => {
      if (!seekerId) throw new Error('Missing seeker id.');
      return recruiterService.getTalentDetail(seekerId);
    },
    staleTime: 30_000,
  });
}

export { TalentForbiddenError };
