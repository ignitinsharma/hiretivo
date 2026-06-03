"use client";

import { useQuery } from "@tanstack/react-query";

type HiretvoStatus = "NOT_SUBMITTED" | "PENDING" | "IN_REVIEW" | "VERIFIED" | "REJECTED";

interface HiretvoVerificationResult {
  status: HiretvoStatus;
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  notSubmitted: boolean;
}

/*
 * useHiretvoVerificationStatus
 * Fetches the seeker's Hiretivo verification status (not email verification).
 * Used to gate apply flows — only VERIFIED seekers can apply.
 */
export function useHiretvoVerificationStatus(): {
  data: HiretvoVerificationResult | undefined;
  isLoading: boolean;
} {
  const query = useQuery<HiretvoVerificationResult>({
    queryKey: ["seeker", "hiretvo-verification-status"],
    queryFn: async () => {
      const res = await fetch("/api/seeker/verification-status");
      if (!res.ok) throw new Error("Failed to fetch verification status");
      const json = await res.json();
      const status: HiretvoStatus = json.data?.status ?? "NOT_SUBMITTED";
      return {
        status,
        isVerified: status === "VERIFIED",
        isPending: status === "PENDING" || status === "IN_REVIEW",
        isRejected: status === "REJECTED",
        notSubmitted: status === "NOT_SUBMITTED",
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return { data: query.data, isLoading: query.isLoading };
}
