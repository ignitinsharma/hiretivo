"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TalentEngineer, TalentFilters } from "../types/talent.types";

/*
 * useTalentPool
 * Infinite query for recruiter talent pool. Cursor-paginated.
 * staleTime: 30s (dynamic data — unlocks/saves change frequently).
 */
export function useTalentPool(filters: TalentFilters) {
  const params = new URLSearchParams();
  if (filters.skills) params.set("skills", filters.skills);
  if (filters.role) params.set("role", filters.role);
  if (filters.salaryMax) params.set("salaryMax", String(filters.salaryMax));
  if (filters.timezoneOverlapMin) params.set("timezoneOverlapMin", String(filters.timezoneOverlapMin));
  if (filters.availableBefore) params.set("availableBefore", filters.availableBefore);

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
  });
}

/*
 * useUnlockEngineer
 * Mutation to unlock an engineer profile. Invalidates talent-pool query on success.
 */
export function useUnlockEngineer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (engineerId: string) => {
      const res = await fetch(`/api/recruiter/talent/${engineerId}/unlock`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) return { ok: false, code: json.code as string, resetAt: json.resetAt as string | null };
      return { ok: true, data: json.data };
    },
    onSuccess: (result) => {
      if (result.ok) qc.invalidateQueries({ queryKey: ["talent-pool"] });
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
