"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminCompanyVerificationItem } from "../types/admin-company.types";

const QUERY_KEY = ["admin-companies"] as const;

/*
 * fetchAdminCompanies
 * Fetches the list of company verification submissions from the admin API.
 * @returns Array of AdminCompanyVerificationItem
 */
async function fetchAdminCompanies(): Promise<AdminCompanyVerificationItem[]> {
  const res = await fetch("/api/admin/companies");
  if (!res.ok) throw new Error("Failed to load companies");
  const json = (await res.json()) as { companies: AdminCompanyVerificationItem[] };
  return json.companies;
}

/*
 * useAdminCompanies
 * TanStack Query hook for the admin company verification list.
 * staleTime: 30s — admin actions are infrequent; no real-time polling required.
 */
export function useAdminCompanies() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAdminCompanies,
    staleTime: 30 * 1000,
  });
}

/*
 * useReviewCompany
 * Mutation hook to approve or reject a Level 2 company verification submission.
 * Invalidates the admin-companies query on success so the list refreshes.
 * @param profileId - RecruiterProfile.id to review
 * @param action - "approve" | "reject"
 */
export function useReviewCompany() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      profileId,
      action,
    }: {
      profileId: string;
      action: "approve" | "reject";
    }) => {
      const res = await fetch(`/api/admin/companies/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Review failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
