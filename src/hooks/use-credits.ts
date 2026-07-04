"use client";

import { useQuery } from "@tanstack/react-query";
import { seekerService } from "@/services/seeker.service";

export const SEEKER_CREDITS_QUERY_KEY = ["seeker-credits"] as const;

/*
 * useCredits
 * Live seeker AI-credit status (remaining/limit this calendar month) for the
 * sidebar widget, wizard soft-gate, and settings Plans tab. Reuses the same
 * query key StepOptimize.tsx (Phase 5) already reads, so a wizard run and the
 * sidebar widget invalidate together.
 */
export function useCredits() {
  return useQuery<{ data: { remaining: number; limit: number } }>({
    queryKey: SEEKER_CREDITS_QUERY_KEY,
    queryFn: seekerService.getCreditStatus,
    staleTime: 30_000,
  });
}
