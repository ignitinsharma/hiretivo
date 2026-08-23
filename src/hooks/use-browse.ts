"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { seekerService, type SeekerFeedResponse } from "@/services/seeker.service";

const PAGE_SIZE = 10;

export interface BrowseFilters {
  q?: string;
  jobType?: string;
  workType?: string;
  locationClass?: string;
  visaSponsored?: boolean;
  experienceLevel?: string;
}

/*
 * useBrowse
 * All-jobs infinite query for Browse page — every OPEN job ordered by publishedAt desc,
 * searchable/filterable, not gated by match score. Dashboard Recommended keeps useFeed.
 */
export function useBrowse(filters?: BrowseFilters) {
  return useInfiniteQuery<SeekerFeedResponse>({
    queryKey: ["browse", filters?.q ?? "", filters?.jobType, filters?.workType, filters?.locationClass, filters?.visaSponsored, filters?.experienceLevel],
    queryFn: ({ pageParam, signal }) =>
      seekerService.getBrowseFeed({ cursor: pageParam as string | undefined, limit: PAGE_SIZE, ...filters }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}
