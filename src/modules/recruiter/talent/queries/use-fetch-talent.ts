'use client';

import { useQuery } from '@tanstack/react-query';

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

/**
 * Converts UI filters into the API parameter shape.
 */
function toTalentParams(filters: TalentFilters): RecruiterTalentParams {
  const params: RecruiterTalentParams = { page: 1, limit: 24 };

  if (filters.q.trim()) params.q = filters.q.trim();

  return params;
}

/**
 * Fetches the paid recruiter Talent Pool list.
 */
export function useFetchTalent(filters: TalentFilters) {
  return useQuery({
    queryKey: [TALENT_QUERY_KEY, filters],
    queryFn: () => recruiterService.getTalent(toTalentParams(filters)),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetches one expanded Talent Pool candidate profile.
 */
export function useFetchTalentDetail(seekerId: string | null) {
  return useQuery({
    queryKey: [TALENT_QUERY_KEY, 'detail', seekerId],
    enabled: Boolean(seekerId),
    queryFn: async (): Promise<TalentDetail> => {
      if (!seekerId) throw new Error('Missing seeker id.');
      return recruiterService.getTalentDetail(seekerId);
    },
  });
}

export { TalentForbiddenError };
