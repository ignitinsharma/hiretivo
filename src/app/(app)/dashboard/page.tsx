"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SearchBar } from "@/components/shared/SearchBar";
import { FilterChips } from "@/components/shared/FilterChips";
import { JobCard } from "@/components/shared/JobCard";
import { JobDrawer } from "@/components/shared/JobDrawer";
import { FreePlanBanner } from "@/modules/dashboard/components/FreePlanBanner";
import { ResumeParseBanner } from "@/modules/dashboard/components/ResumeParseBanner";
import { ApplicationsTable } from "@/modules/dashboard/components/ApplicationsTable";
import { useFeed, type FeedFilters } from "@/hooks/use-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/store/use-ui-store";
import { applicationService } from "@/services/application.service";

export default function DashboardPage() {
  const [filters, setFilters] = useState<FeedFilters>({});
  const [search, setSearch] = useState("");
  const [drawerJobId, setDrawerJobId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { openAddCustomJobModal } = useUIStore();
  const queryClient = useQueryClient();

  const activeFilters = useMemo(() => {
    const f: FeedFilters = { ...filters };
    if (search.trim()) f.q = search.trim();
    return f;
  }, [filters, search]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(activeFilters);

  const jobs = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.jobs);
  }, [data]);

  const totalCount = data?.pages?.[0]?.totalCount ?? jobs.length;

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleApply = useCallback(
    async (jobId: string) => {
      setDrawerJobId(null);
      setApplyingId(jobId);

      try {
        const app = await applicationService.applyToJob({ jobId });
        applicationService.generateResume(app.id).catch(() => {});
        await queryClient.invalidateQueries({ queryKey: ["applications"] });
        await queryClient.invalidateQueries({ queryKey: ["jobs"] });
        window.location.href = "/dashboard/tracker";
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to apply. Please try again.";
        toast.error(message);
      } finally {
        setApplyingId(null);
      }
    },
    [queryClient],
  );

  return (
    <div className="space-y-6">
      <SearchBar value={search} onChange={setSearch} resultCount={totalCount} />
      <FilterChips
        activeFilters={filters as Partial<Record<string, string | undefined>>}
        onFilterChange={handleFilterChange}
      />
      <FreePlanBanner />
      <ResumeParseBanner />

      <div>
        <h2 className="text-lg font-bold text-brand-foreground mb-4">
          Recommended jobs
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <p className="text-sm text-brand-foreground-muted">
              Could not load jobs. Please try again.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <button
              onClick={openAddCustomJobModal}
              className="rounded-xl border border-dashed hover:border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center gap-2 min-h-80 border-brand-primary hover:bg-brand-primary/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-brand-primary transition-colors">
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-brand-primary transition-colors">
                Add your own job
              </span>
            </button>

            {jobs.map((job) => (
              <div
                key={job.id}
                className="cursor-pointer"
                onClick={() => setDrawerJobId(job.id)}
              >
                <JobCard job={job} onApply={() => handleApply(job.id)} />
              </div>
            ))}
          </div>
        )}

        {hasNextPage && !isLoading && (
          <div className="text-center pt-6">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
            >
              {isFetchingNextPage ? "Loading more..." : "Load more jobs"}
            </button>
          </div>
        )}
      </div>

      <ApplicationsTable />

      <JobDrawer
        jobId={drawerJobId}
        open={drawerJobId !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerJobId(null);
        }}
        onApply={handleApply}
      />
    </div>
  );
}
