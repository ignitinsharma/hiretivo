"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface ApplicationStatus {
  automationStatus: string | null;
  failureReason: string | null;
  generationCount: number;
}

async function fetchStatus(applicationId: string): Promise<ApplicationStatus> {
  const res = await fetch(`/api/applications/${applicationId}/status`);
  if (!res.ok) throw new Error("Failed to load status");
  return res.json();
}

/*
 * useApplicationStatus
 * Polls GET /api/applications/:id/status every 3s while GENERATING. Pauses when tab hidden.
 */
export function useApplicationStatus(applicationId: string | null) {
  const query = useQuery({
    queryKey: ["application-status", applicationId],
    queryFn: () => fetchStatus(applicationId!),
    enabled: Boolean(applicationId),
    refetchInterval: (q) => (q.state.data?.automationStatus === "GENERATING" ? 3000 : false),
    staleTime: 2000,
  });

  useEffect(() => {
    if (!applicationId) return;
    const onVis = () => {
      if (document.visibilityState === "visible" && query.data?.automationStatus === "GENERATING") {
        query.refetch();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [applicationId, query]);

  return query;
}
