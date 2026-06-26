"use client";

import { useMutation, useInfiniteQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";

import { apiClient } from "@/lib/axios";

import type { JobListItem } from "@/modules/jobs/types/job.types";

export interface SavedJobItem {
  id: string;
  savedAt: string;
  application: {
    id: string;
    status: string;
  } | null;
  job: JobListItem & {
    isClosed: boolean;
    applyType?: string;
    externalApplyUrl?: string | null;
  };
}

interface SavedJobsPage {
  data: SavedJobItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const SAVED_JOBS_QUERY_KEY = ["seeker-saved-jobs"] as const;

async function fetchSavedJobsPage({ pageParam }: { pageParam: number }): Promise<SavedJobsPage> {
  const { data } = await apiClient.get<SavedJobsPage>("/seeker/saved-jobs", {
    params: { page: pageParam, limit: 10 },
  });
  return data;
}

async function saveJob(jobId: string): Promise<void> {
  await apiClient.post(`/seeker/saved-jobs/${jobId}`);
}

async function unsaveJob(jobId: string): Promise<void> {
  await apiClient.delete(`/seeker/saved-jobs/${jobId}`);
}

interface UseSavedJobsOptions {
  enabled?: boolean;
}

export function useSavedJobs(options?: UseSavedJobsOptions) {
  return useInfiniteQuery<
    SavedJobsPage,
    Error,
    InfiniteData<SavedJobsPage>,
    typeof SAVED_JOBS_QUERY_KEY,
    number
  >({
    queryKey: SAVED_JOBS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchSavedJobsPage({ pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}

export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveJob,
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
      const previous = queryClient.getQueryData<{
        pages: SavedJobsPage[];
        pageParams: number[];
      }>(SAVED_JOBS_QUERY_KEY);

      const placeholder: SavedJobItem = {
        id: `optimistic-${jobId}`,
        savedAt: new Date().toISOString(),
        application: null,
        job: { id: jobId } as SavedJobItem["job"],
      };

      queryClient.setQueryData<{ pages: SavedJobsPage[]; pageParams: number[] }>(
        SAVED_JOBS_QUERY_KEY,
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page, i) =>
                  i === 0
                    ? { ...page, data: [placeholder, ...page.data] }
                    : page,
                ),
              }
            : old,
      );

      return { previous };
    },
    onError: (_err, _jobId, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(SAVED_JOBS_QUERY_KEY, ctx.previous);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
    },
  });
}

export function useUnsaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unsaveJob,
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
      const previous = queryClient.getQueryData<{
        pages: SavedJobsPage[];
        pageParams: number[];
      }>(SAVED_JOBS_QUERY_KEY);

      queryClient.setQueryData<{ pages: SavedJobsPage[]; pageParams: number[] }>(
        SAVED_JOBS_QUERY_KEY,
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.filter((item) => item.job.id !== jobId),
                })),
              }
            : old,
      );

      return { previous };
    },
    onError: (_err, _jobId, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(SAVED_JOBS_QUERY_KEY, ctx.previous);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
    },
  });
}
