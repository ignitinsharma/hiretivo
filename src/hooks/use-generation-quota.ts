"use client";

import { useQuery } from "@tanstack/react-query";

interface GenerationQuota {
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: string;
  plan: string;
}

async function fetchQuota(): Promise<GenerationQuota> {
  const res = await fetch("/api/generation-quota");
  if (!res.ok) throw new Error("Failed to fetch quota");
  return res.json();
}

export function useGenerationQuota() {
  return useQuery({
    queryKey: ["generation-quota"],
    queryFn: fetchQuota,
    staleTime: 60_000,
  });
}
