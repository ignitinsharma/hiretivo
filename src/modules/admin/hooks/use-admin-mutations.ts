"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminJobService } from "../services/admin-job.service";
import type { AdminJobCreateInput, AdminJobUpdateInput } from "@/lib/validations/admin-job.schema";

/*
 * useCreateAdminJob
 * Mutation to create a new admin-posted job.
 * On success, invalidates the admin-jobs list cache so the new job appears immediately.
 * @returns TanStack Query mutation result; call mutate(payload: AdminJobCreateInput)
 */
export function useCreateAdminJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminJobCreateInput) => adminJobService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
  });
}

/*
 * useUpdateAdminJob
 * Mutation to partially update an existing admin job (PATCH).
 * On success, invalidates both the list cache and the individual job cache.
 * @param id - The job ID to update
 * @returns TanStack Query mutation result; call mutate(payload: AdminJobUpdateInput)
 */
export function useUpdateAdminJob(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminJobUpdateInput) => adminJobService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      qc.invalidateQueries({ queryKey: ["admin-job", id] });
    },
  });
}

/*
 * useDeleteAdminJob
 * Mutation to soft-delete an admin job.
 * On success, invalidates the admin-jobs list cache.
 * @returns TanStack Query mutation result; call mutate(id: string)
 */
export function useDeleteAdminJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminJobService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
  });
}

/*
 * usePublishAdminJob
 * Mutation to publish an admin job (DRAFT → OPEN transition).
 * On success, invalidates both list and individual job caches so the
 * status badge and publishedAt timestamp update everywhere.
 * @returns TanStack Query mutation result; call mutate(id: string)
 */
export function usePublishAdminJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminJobService.publish(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["admin-jobs"] });
      qc.invalidateQueries({ queryKey: ["admin-job", id] });
    },
  });
}
