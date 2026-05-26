"use client";

import { useState } from "react";
import { EngineerCard } from "./EngineerCard";
import { TalentFilters } from "./TalentFilters";
import { QuotaDisplay } from "./QuotaDisplay";
import { SeekingStatusFilter } from "./SeekingStatusFilter";
import { Button } from "@/components/ui/button";
import { PLAN_TIERS } from "@/constants/pricing";
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
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useTalentPool(filters, !isFreePlan);

  const engineers = data?.pages.flatMap((p) => p.items) ?? [];
  const quotaExhausted = totalQuota !== null && usedQuota >= totalQuota;

  return (
    <div className="relative flex flex-col gap-6">
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

      <SeekingStatusFilter
        value={filters.seekingStatus}
        onChange={(next) => setFilters((prev) => ({ ...prev, seekingStatus: next }))}
      />

      <TalentFilters filters={filters} onChange={setFilters} />

      {isFreePlan && (
        <div className="absolute inset-x-0 top-24 z-10 rounded-xl border border-brand-border bg-white/95 p-6 backdrop-blur sm:p-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold text-brand-primary">Talent Pool locked</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-foreground">
              Upgrade to browse verified Indian engineers
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-foreground-muted">
              FREE recruiters can preview the product shell. STARTER, GROWTH, and
              SCALE unlock the live Talent Pool and recruiter contact workflow.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[PLAN_TIERS.STARTER, PLAN_TIERS.GROWTH, PLAN_TIERS.SCALE].map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-brand-border bg-white p-4"
                >
                  <p className="font-semibold text-brand-foreground">{plan.name}</p>
                  <p className="mt-1 text-2xl font-bold text-brand-foreground">
                    ${plan.price}
                    <span className="text-sm font-normal text-brand-foreground-muted">
                      /mo
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-brand-foreground-muted">
                    {plan.unlocks === null
                      ? "Unlimited unlocks"
                      : `${plan.unlocks} engineer unlocks/mo`}
                  </p>
                </div>
              ))}
            </div>
            <Button asChild variant="primary" className="mt-6">
              <a href="/pricing">Upgrade plan</a>
            </Button>
          </div>
        </div>
      )}

      <div className={isFreePlan ? "pointer-events-none select-none blur-sm" : undefined}>
      {isFreePlan && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl border border-brand-border bg-white p-5">
              <div className="mb-4 h-5 w-32 rounded bg-brand-surface" />
              <div className="mb-2 h-4 w-44 rounded bg-brand-surface" />
              <div className="mb-5 h-4 w-28 rounded bg-brand-surface" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, chipIndex) => (
                  <div key={chipIndex} className="h-7 w-20 rounded-lg bg-brand-surface" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isFreePlan && isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl border border-brand-border bg-brand-surface animate-pulse" />
          ))}
        </div>
      )}

      {!isFreePlan && isError && (
        <div className="rounded-xl border border-brand-border bg-white p-6 text-center">
          <p className="text-brand-danger font-medium">Failed to load talent pool</p>
          <p className="text-sm text-brand-foreground-muted mt-1">Please refresh the page</p>
        </div>
      )}

      {!isFreePlan && !isLoading && !isError && engineers.length === 0 && (
        <div className="rounded-xl border border-brand-border bg-white p-10 text-center">
          <p className="font-semibold text-brand-foreground">No engineers match your filters</p>
          <p className="text-sm text-brand-foreground-muted mt-1">Try adjusting your filters</p>
        </div>
      )}

      {!isFreePlan && engineers.length > 0 && (
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

      {!isFreePlan && hasNextPage && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
