"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminJobService } from "../services/admin-job.service";

/*
 * useCompanySuggest
 * Debounced (300ms) company autocomplete query for the admin job form.
 * Returns an empty companies array when the debounced query is shorter than
 * 1 character to avoid unnecessary API calls on empty input.
 * staleTime is 60s — company names change rarely.
 * @param rawQuery - The raw (non-debounced) search string from the input
 * @returns TanStack Query result containing { companies: CompanySuggestion[] }
 */
export function useCompanySuggest(rawQuery: string) {
  const [debounced, setDebounced] = useState(rawQuery);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(rawQuery), 300);
    return () => clearTimeout(t);
  }, [rawQuery]);

  return useQuery({
    queryKey: ["admin-company-suggest", debounced],
    queryFn: () => adminJobService.suggestCompanies(debounced),
    enabled: debounced.trim().length >= 1,
    staleTime: 60 * 1000,
  });
}
