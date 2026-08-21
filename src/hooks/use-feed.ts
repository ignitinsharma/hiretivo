"use client";

import { useRef, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { seekerService, type SeekerFeedResponse } from "@/services/seeker.service";

const PAGE_SIZE = 10;

export interface FeedFilters {
  q?: string;
  jobType?: string;
  workType?: string;
  locationClass?: string;
  visaSponsored?: boolean;
  experienceLevel?: string;
}

/*
 * useFeed
 * Infinite query for the seeker job feed with debounced search, AbortController,
 * and dedup. Query key: ["jobs", debouncedSearch, filters, page].
 * Empty query resets the feed.
 */
export function useFeed(filters?: FeedFilters) {
  return useInfiniteQuery<SeekerFeedResponse>({
    queryKey: ["jobs", filters?.q ?? "", filters?.jobType, filters?.workType, filters?.locationClass, filters?.visaSponsored, filters?.experienceLevel],
    queryFn: ({ pageParam, signal }) =>
      seekerService.getFeed(
        { cursor: pageParam as string | undefined, limit: PAGE_SIZE, ...filters },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}