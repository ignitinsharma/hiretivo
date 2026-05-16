"use client";

import { useState } from "react";
import { EngineerCard } from "./EngineerCard";
import { TalentFilters } from "./TalentFilters";
import { QuotaDisplay } from "./QuotaDisplay";
import { Button } from "@/components/ui/button";
import { useTalentPool } from "../queries/use-talent-pool";
import type { TalentFilters as TalentFiltersType } from "../types/talent.types";

interface TalentPoolClientProps {
  isFreePlan: boolean;
  totalQuota: number | null;
  usedQuota: number;
  quotaResetAt: string | null;
}

/*
 * TalentPoolClient
 * Client component for talent pool browse page.
 * Handles filter state, infinite scroll pagination, and quota display.
 */
export function TalentPoolClient({ isFreePlan, totalQuota, usedQuota, quotaResetAt }: TalentPoolClientProps) {
  const [filters, setFilters] = useState<TalentFiltersType>({});
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useTalentPool(filters);

  const engineers = data?.pages.flatMap((p) => p.items) ?? [];
  const quotaExhausted = totalQuota !== null && usedQuota >= totalQuota;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl text-brand-foreground">Talent Pool</h1>
          <p className="text-brand-foreground-muted mt-1">Browse verified Indian engineers</p>
        </div>
        {!isFreePlan && (
          <QuotaDisplay
            used={usedQuota}
            total={totalQuota}
            resetAt={quotaResetAt ? new Date(quotaResetAt) : null}
          />
        )}
      </div>

      <TalentFilters filters={filters} onChange={setFilters} />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl border border-brand-border bg-brand-surface animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-brand-border bg-white p-6 text-center">
          <p className="text-brand-danger font-medium">Failed to load talent pool</p>
          <p className="text-sm text-brand-foreground-muted mt-1">Please refresh the page</p>
        </div>
      )}

      {!isLoading && !isError && engineers.length === 0 && (
        <div className="rounded-xl border border-brand-border bg-white p-10 text-center">
          <p className="font-semibold text-brand-foreground">No engineers match your filters</p>
          <p className="text-sm text-brand-foreground-muted mt-1">Try adjusting your filters</p>
        </div>
      )}

      {engineers.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {engineers.map((eng) => (
            <EngineerCard
              key={eng.id}
              engineer={eng}
              isFreePlan={isFreePlan}
              quotaExhausted={quotaExhausted}
              quotaResetAt={quotaResetAt}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
