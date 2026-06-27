"use client";
import { useQuery } from "@tanstack/react-query";
import { adminJobService } from "../services/admin-job.service";
import type { AdminJobsListResponse } from "../types/admin-job.types";

/*
 * useAdminJobs
 * Fetches a paginated admin job list with optional status and page filters.
 * staleTime is 30s — DRAFT/OPEN transitions are admin-driven and infrequent.
 * @param status - Optional JobStatus string to filter (e.g. "DRAFT", "OPEN"). Omit or pass undefined for all.
 * @param page   - 1-indexed page number. Defaults to 1.
 * @returns TanStack Query result typed as AdminJobsListResponse
 */
export function useAdminJobs(status?: string, page = 1) {
  return useQuery<AdminJobsListResponse>({
    queryKey: ["admin-jobs", status ?? "ALL", page],
    queryFn: () => adminJobService.list(status, page),
    staleTime: 30 * 1000,
  });
}
