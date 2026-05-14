"use client";
import { useQuery } from "@tanstack/react-query";
import { adminJobService } from "../services/admin-job.service";

/*
 * useAdminJobs
 * Fetches the admin job list with an optional status filter.
 * staleTime is 30s — DRAFT/OPEN transitions are admin-driven and infrequent.
 * @param status - Optional JobStatus string to filter the list (e.g. "DRAFT", "OPEN")
 * @returns TanStack Query result containing { jobs: AdminJobListItem[] }
 */
export function useAdminJobs(status?: string) {
  return useQuery({
    queryKey: ["admin-jobs", status ?? "ALL"],
    queryFn: () => adminJobService.list(status),
    staleTime: 30 * 1000,
  });
}
