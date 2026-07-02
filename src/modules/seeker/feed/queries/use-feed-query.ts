'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { seekerService, type SeekerFeedResponse } from '@/services/seeker.service';
import type { FeedFilters } from '@/modules/seeker/feed/types/feed.types';

const PAGE_SIZE = 10;

/* feedQueryKey — stable array key for the filter-aware feed. */
export function feedQueryKey(filters: FeedFilters): ['feed', FeedFilters] {
  return ['feed', filters];
}

/* useFeedQuery
 * Filter-aware, cursor-paginated seeker feed. Match-ranked server-side.
 * @param filters - active FeedFilters (from URL)
 * @returns TanStack useInfiniteQuery result over SeekerFeedResponse pages. */
export function useFeedQuery(filters: FeedFilters) {
  return useInfiniteQuery<SeekerFeedResponse>({
    queryKey: feedQueryKey(filters),
    queryFn: ({ pageParam }) =>
      seekerService.getFeed({ cursor: pageParam as string | undefined, limit: PAGE_SIZE, ...filters }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}
