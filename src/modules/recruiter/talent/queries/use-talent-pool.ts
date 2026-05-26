"use client";

import { toast } from "sonner";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TalentEngineer, TalentFilters } from "../types/talent.types";

/*
 * useTalentPool
 * Infinite query for recruiter talent pool. Cursor-paginated.
 * staleTime: 30s (dynamic data — unlocks/saves change frequently).
 */
export function useTalentPool(filters: TalentFilters, enabled = true) {
  const params = new URLSearchParams();
  if (filters.skills) params.set("skills", filters.skills);
  if (filters.role) params.set("role", filters.role);
  if (filters.salaryMax) params.set("salaryMax", String(filters.salaryMax));
  if (filters.timezoneOverlapMin) params.set("timezoneOverlapMin", String(filters.timezoneOverlapMin));
  if (filters.availableBefore) params.set("availableBefore", filters.availableBefore);
  if (filters.seekingStatus) params.set("seekingStatus", filters.seekingStatus);

  return useInfiniteQuery({
    queryKey: ["talent-pool", filters],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      if (pageParam) params.set("cursor", pageParam);
      const res = await fetch(`/api/recruiter/talent?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json() as { data: { items: TalentEngineer[]; nextCursor: string | null } };
      return json.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    enabled,
  });
}

/*
 * useUnlockEngineer
 * Mutation to unlock an engineer profile. Throws on non-OK responses so
 * React Query's onError handler fires and UI can surface the error.
 */
export function useUnlockEngineer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (engineerId: string) => {
      const res = await fetch(`/api/recruiter/talent/${engineerId}/unlock`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        const err = new Error(json.code ?? "Failed to unlock profile") as Error & { code: string; resetAt: string | null };
        err.code = json.code;
        err.resetAt = json.resetAt ?? null;
        throw err;
      }
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["talent-pool"] });
    },
    onError: (err: Error & { code?: string; resetAt?: string | null }) => {
      switch (err.code) {
        case "UPGRADE_REQUIRED":
          toast.error("Upgrade your plan to unlock engineer profiles");
          break;
        case "QUOTA_EXHAUSTED":
          toast.error(
            err.resetAt
              ? `Unlock quota exhausted — resets ${new Date(err.resetAt).toLocaleDateString()}`
              : "Unlock quota exhausted for this billing period",
          );
          break;
        default:
          toast.error("Failed to unlock profile. Please try again.");
      }
    },
  });
}

/*
 * useSaveEngineer
 * Mutation to save or unsave an engineer. Invalidates talent-pool and saved-engineers queries.
 */
export function useSaveEngineer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ engineerId, save }: { engineerId: string; save: boolean }) => {
      const res = await fetch(`/api/recruiter/talent/${engineerId}/save`, {
        method: save ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["talent-pool"] });
      qc.invalidateQueries({ queryKey: ["saved-engineers"] });
    },
  });
}
