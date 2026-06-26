"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { seekerService, type SeekerFeedResponse } from "@/services/seeker.service";

const PAGE_SIZE = 10;

export function useFeed() {
  return useInfiniteQuery<SeekerFeedResponse>({
    queryKey: ["seeker-feed"],
    queryFn: ({ pageParam }) =>
      seekerService.getFeed({ cursor: pageParam as string | undefined, limit: PAGE_SIZE }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}
