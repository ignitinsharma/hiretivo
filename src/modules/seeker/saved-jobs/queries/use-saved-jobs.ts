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

export function useSavedJobs() {
  return useQuery({
    queryKey: SAVED_JOBS_QUERY_KEY,
    queryFn: fetchSavedJobs,
  });
}

export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["seeker-feed"] });
    },
  });
}

export function useUnsaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unsaveJob,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAVED_JOBS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["seeker-feed"] });
    },
  });
}
