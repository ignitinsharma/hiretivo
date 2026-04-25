"use client";

import { useQuery } from "@tanstack/react-query";
import { recruiterService } from "@/services/recruiter.service";
import type { DashboardData } from "@/modules/recruiter/dashboard/types/dashboard.types";

export function useFetchRecruiterDashboard() {
  return useQuery({
    queryKey: ["recruiter-dashboard"],
    queryFn: recruiterService.getDashboard,
    staleTime: 30_000,
  });
}
