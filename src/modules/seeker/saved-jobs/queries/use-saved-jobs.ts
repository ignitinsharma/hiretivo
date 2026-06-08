"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

interface SavedJobsResponse {
  data: SavedJobItem[];
}

const SAVED_JOBS_QUERY_KEY = ["seeker-saved-jobs"] as const;

async function fetchSavedJobs(): Promise<SavedJobItem[]> {
  const { data } = await apiClient.get<SavedJobsResponse>("/seeker/saved-jobs");
  return data.data;
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
  return useQuery({
    queryKey: SAVED_JOBS_QUERY_KEY,
    queryFn: fetchSavedJobs,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}

/*
 * useSaveJob
 * Mutation to save a job to the seeker's saved list.
 * Uses optimistic update: immediately adds a placeholder to the seeker-saved-jobs cache
 * so the save button reflects state instantly. On success, invalidates the cache to
 * replace the placeholder with real server data. Never invalidates seeker-feed
 * (isSaved is derived solely from seeker-saved-jobs cache, not feed data).
 */
export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveJob,
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
      const previous = queryClient.getQueryData<SavedJobItem[]>(SAVED_JOBS_QUERY_KEY);

      queryClient.setQueryData<SavedJobItem[]>(SAVED_JOBS_QUERY_KEY, (old) => {
        if (!old) return old;
        const placeholder: SavedJobItem = {
          id: `optimistic-${jobId}`,
          savedAt: new Date().toISOString(),
          application: null,
          job: { id: jobId } as SavedJobItem["job"],
        };
        return [...old, placeholder];
      });

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

/*
 * useUnsaveJob
 * Mutation to remove a job from the seeker's saved list.
 * Uses optimistic update: immediately removes the item from the seeker-saved-jobs cache
 * so the save button reflects state instantly. Rolls back on error. On success,
 * invalidates the cache to sync with server. Never invalidates seeker-feed.
 */
export function useUnsaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unsaveJob,
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
      const previous = queryClient.getQueryData<SavedJobItem[]>(SAVED_JOBS_QUERY_KEY);

      queryClient.setQueryData<SavedJobItem[]>(SAVED_JOBS_QUERY_KEY, (old) =>
        old ? old.filter((item) => item.job.id !== jobId) : old,
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
