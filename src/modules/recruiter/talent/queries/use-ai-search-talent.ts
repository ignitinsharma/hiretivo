'use client';

import { useQuery } from '@tanstack/react-query';

import { recruiterService } from '@/services/recruiter.service';
import type { ParsedFilters } from '@/lib/validations/ai-search.schema';
import type { AiSearchResponseData } from '@/modules/recruiter/talent/types/talent.types';

const AI_SEARCH_QUERY_KEY = 'recruiter-talent-ai-search';

/*
 * useAiSearchTalent
 * Fetches AI-ranked talent results for a natural-language query.
 * Enabled only when query is non-empty.
 * staleTime 30s — caches results to avoid re-burning AI quota on re-renders or
 * rapid chip additions/removals if the same (query + filters) combination recurs.
 * @param query - The raw NL query string (empty string disables the query)
 * @param parsedFilters - Optional; when provided, skips the server-side parse step
 * @param page - Page number (defaults to 1 for AI mode)
 */
export function useAiSearchTalent(
  query: string,
  parsedFilters?: ParsedFilters,
  page = 1,
) {
  return useQuery<AiSearchResponseData>({
    queryKey: [AI_SEARCH_QUERY_KEY, query, parsedFilters, page],
    queryFn: () => recruiterService.aiSearchTalent(query, parsedFilters, page),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });
}
