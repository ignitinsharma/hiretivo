"use client";
import { useQuery } from "@tanstack/react-query";
import { adminJobService } from "../services/admin-job.service";

/*
 * useAdminJob
 * Fetches a single admin job detail by ID for the edit/view page.
 * Query is disabled when id is undefined (e.g. before route param is resolved).
 * @param id - The job ID to fetch, or undefined while loading
 * @returns TanStack Query result containing { job: AdminJobDetail }
 */
export function useAdminJob(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-job", id],
    queryFn: () => adminJobService.get(id!),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}
