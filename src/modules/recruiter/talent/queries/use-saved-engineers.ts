"use client";

import { useQuery } from "@tanstack/react-query";
import type { TalentEngineer } from "../types/talent.types";

/*
 * useSavedEngineers
 * Fetches recruiter's saved engineer list from the saved endpoint.
 * staleTime: 30s.
 */
export function useSavedEngineers() {
  return useQuery({
    queryKey: ["saved-engineers"],
    queryFn: async () => {
      const res = await fetch("/api/recruiter/saved");
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json() as { data: { items: TalentEngineer[]; nextCursor: string | null } };
      return json.data.items;
    },
    staleTime: 30_000,
  });
}
