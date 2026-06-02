"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { apiClient } from "@/lib/axios";
import { UserRole } from "@/constants/enums";

export const VERIFICATION_STATUS_QUERY_KEY = ["seeker-verification-status"] as const;

export interface SeekerVerificationStatus {
  status: string | null;
  isLoading: boolean;
  isVerified: boolean;
}

/*
 * useVerificationStatus
 * Fetches the seeker's Hiretivo verification status from /api/seeker/verification-status.
 * Used client-side to gate the Apply button — shows a locked state for unverified seekers.
 * Only runs when the authenticated user is a SEEKER.
 * Returns { status, isLoading, isVerified } — isVerified is true only when status === 'VERIFIED'.
 */
export function useVerificationStatus(): SeekerVerificationStatus {
  const { data: session, status: sessionStatus } = useSession();

  const isSeeker =
    sessionStatus === "authenticated" && session?.user?.role === UserRole.SEEKER;

  const { data, isLoading } = useQuery<{ data: { status: string } }>({
    queryKey: VERIFICATION_STATUS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { status: string } }>(
        "/seeker/verification-status",
      );
      return data;
    },
    enabled: isSeeker,
    staleTime: 60_000,
  });

  const status = data?.data?.status ?? null;

  return {
    status,
    isLoading: isSeeker ? isLoading : false,
    isVerified: status === "VERIFIED",
  };
}
