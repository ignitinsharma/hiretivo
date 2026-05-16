"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface WhoViewedMeEntry {
  companyName: string;
  companyDomain: string;
  unlockedAt: string;
  source: "talent_pool" | "application_auto";
}

interface BlockedDomainEntry {
  domain: string;
  blockedAt: string;
}

interface ProfileVisibilityData {
  blockedDomains: BlockedDomainEntry[];
  whoViewedMe: WhoViewedMeEntry[];
}

/*
 * useProfileVisibility
 * Fetches blocked recruiter domains and who-viewed-me from
 * GET /api/engineer/block-recruiter.
 * staleTime: 30s.
 */
export function useProfileVisibility() {
  return useQuery({
    queryKey: ["profile-visibility"],
    queryFn: async (): Promise<ProfileVisibilityData> => {
      const res = await fetch("/api/engineer/block-recruiter");
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json() as { data: ProfileVisibilityData };
      return json.data;
    },
    staleTime: 30_000,
  });
}

/*
 * useHideProfile
 * Mutation to set or clear hiddenUntil via POST /api/engineer/hide-profile.
 * Invalidates profile-visibility on success.
 */
export function useHideProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { hide: boolean; until?: string }) => {
      const res = await fetch("/api/engineer/hide-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ data: { hidden: boolean; hiddenUntil: string | null } }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile-visibility"] });
      qc.invalidateQueries({ queryKey: ["seeker-settings"] });
    },
  });
}

/*
 * useBlockRecruiter
 * Mutation to block a recruiter domain via POST /api/engineer/block-recruiter.
 * Invalidates profile-visibility on success.
 */
export function useBlockRecruiter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recruiterDomain: string) => {
      const res = await fetch("/api/engineer/block-recruiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recruiterDomain }),
      });
      if (!res.ok) {
        const json = await res.json() as { error: string };
        throw new Error(json.error ?? "Failed to block");
      }
      return res.json() as Promise<{ data: { blocked: string } }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile-visibility"] });
    },
  });
}
