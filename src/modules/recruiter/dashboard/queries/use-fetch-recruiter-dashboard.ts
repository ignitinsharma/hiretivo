"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@/modules/recruiter/dashboard/types/dashboard.types";

async function fetchRecruiterDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/recruiter/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard");
  const json = (await res.json()) as { data: DashboardData };
  return json.data;
}

export function useFetchRecruiterDashboard() {
  return useQuery({
    queryKey: ["recruiter-dashboard"],
    queryFn: fetchRecruiterDashboard,
    staleTime: 30_000,
  });
}
