"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { SearchBar } from "@/components/shared/SearchBar";
import { FilterChips } from "@/components/shared/FilterChips";
import { JobCard } from "@/components/shared/JobCard";
import { JobDrawer } from "@/components/shared/JobDrawer";
import { useFeed, type FeedFilters } from "@/hooks/use-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/store/use-ui-store";
import { useGenerationQuota } from "@/hooks/use-generation-quota";
import { applicationService } from "@/services/application.service";

export function BrowseJobGrid() {
  const [filters, setFilters] = useState<FeedFilters>({});
  const [search, setSearch] = useState("");
  const [drawerJobId, setDrawerJobId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { openAddCustomJobModal, openPaidFeatureModal } = useUIStore();
  const queryClient = useQueryClient();
  const { data: quota } = useGenerationQuota();

  const activeFilters = useMemo(() => {
    const f: FeedFilters = { ...filters };
    if (search.trim()) f.q = search.trim();
    return f;
  }, [filters, search]);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(activeFilters);

  const jobs = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.jobs);
  }, [data]);

  const totalCount = data?.pages?.[0]?.totalCount ?? jobs.length;

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleApply = useCallback(async (jobId: string) => {
    setDrawerJobId(null);
    setApplyingId(jobId);

    try {
      const app = await applicationService.applyToJob({ jobId });
      applicationService.generateResume(app.id).catch((e) => console.error("Generate failed:", e));
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      window.location.href = "/dashboard/tracker";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply. Please try again.";
      toast.error(message);
    } finally {
      setApplyingId(null);
    }
  }, [queryClient]);

  const handleCardClick = useCallback((jobId: string) => {
    setDrawerJobId(jobId);
  }, []);

  return (
    <div className="space-y-5">
      <SearchBar
        value={search}
        onChange={setSearch}
        resultCount={totalCount}
      />
      <FilterChips
        activeFilters={filters as Partial<Record<string, string | undefined>>}
        onFilterChange={handleFilterChange}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-sm text-brand-foreground-muted">Could not load jobs. Please try again.</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-brand-foreground-muted">No jobs found matching your criteria.</p>
          <p className="text-xs text-brand-foreground-secondary mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <button
            onClick={() => {
              if (quota && !quota.allowed) {
                openPaidFeatureModal({
                  feature: "resume_generation",
                  title: "No generations left",
                  description: `You&apos;ve used all ${quota.limit} generations this month. Upgrade to generate more tailored resumes.`,
                });
                return;
              }
              openAddCustomJobModal();
            }}
            className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center gap-2 min-h-[320px] hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-brand-primary transition-colors">
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-400 group-hover:text-brand-primary transition-colors">
              Add your own
            </span>
          </button>

          {jobs.map((job) => (
            <div key={job.id} className="cursor-pointer" onClick={() => handleCardClick(job.id)}>
              <JobCard
                job={job}
                onApply={() => handleApply(job.id)}
              />
            </div>
          ))}
        </div>
      )}

      {hasNextPage && !isLoading && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading more...
              </span>
            ) : (
              "Load more jobs"
            )}
          </button>
        </div>
      )}

      <JobDrawer
        jobId={drawerJobId}
        open={drawerJobId !== null}
        onOpenChange={(open) => { if (!open) setDrawerJobId(null); }}
        onApply={handleApply}
      />
    </div>
  );
}
