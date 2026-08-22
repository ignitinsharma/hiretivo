"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { SearchBar } from "@/components/shared/SearchBar";
import { FilterChips } from "@/components/shared/FilterChips";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PastelJobCard, PastelCardSkeleton } from "@/components/shared/PastelJobCard";
import { AddYourOwnLinkCard } from "@/components/shared/AddYourOwnLinkCard";
import { JobDrawer } from "@/components/shared/JobDrawer";
import { SavedJobsModal } from "@/components/shared/SavedJobsModal";
import { useBrowse, type BrowseFilters } from "@/hooks/use-browse";
import { applicationService } from "@/services/application.service";
import { seekerService, type SeekerFeedResponse } from "@/services/seeker.service";
import { useUIStore } from "@/store/use-ui-store";
import { useGenerationQuota } from "@/hooks/use-generation-quota";
import { useApplicationStatus } from "@/hooks/use-application-status";
import { useSavedJobs, useSaveJob, useUnsaveJob } from "@/modules/seeker/saved-jobs/queries/use-saved-jobs";

/*
 * BrowseJobGrid
 * All-jobs browse — pastel cards index%5, infinite scroll sentinel, Pass/Apply footer.
 * Apply on card opens drawer; drawer Apply generates in background, toast, remove card.
 * Plan gate: if quota !allowed → Upgrade Plan modal/tooltip.
 */
export function BrowseJobGrid() {
  const [filters, setFilters] = useState<BrowseFilters>({});
  const [search, setSearch] = useState("");
  const [drawerJobId, setDrawerJobId] = useState<string | null>(null);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [jobAppIdMap, setJobAppIdMap] = useState<Record<string, string>>({});
  const [readyJobIds, setReadyJobIds] = useState<Set<string>>(new Set());
  const [failedInfo, setFailedInfo] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const { data: quota } = useGenerationQuota();
  const { openPaidFeatureModal } = useUIStore();
  const generatingJobIds = useUIStore((s) => s.generatingJobIds);
  const addGeneratingJobId = useUIStore((s) => s.addGeneratingJobId);
  const removeGeneratingJobId = useUIStore((s) => s.removeGeneratingJobId);
  const { data: savedJobsData } = useSavedJobs();
  const saveMutation = useSaveJob();
  const unsaveMutation = useUnsaveJob();
  const savedCount = (savedJobsData?.pages.flatMap((p) => p.data) ?? []).length;
  const savedJobIds = new Set((savedJobsData?.pages.flatMap((p) => p.data.map((s) => s.job.id)) ?? []));

  const currentAppId = drawerJobId ? jobAppIdMap[drawerJobId] ?? null : null;
  const { data: appStatus } = useApplicationStatus(currentAppId);

  const activeFilters = useMemo(() => {
    const f: BrowseFilters = { ...filters };
    if (search.trim()) f.q = search.trim();
    return f;
  }, [filters, search]);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrowse(activeFilters);

  const jobs = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.jobs);
  }, [data]);

  const totalCount = data?.pages?.[0]?.totalCount ?? jobs.length;

  const handleFilterChange = useCallback((key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Optimistic remove helper
  const removeJobFromBrowse = useCallback((jobId: string) => {
    queryClient.setQueryData(["browse"], (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((p: SeekerFeedResponse) => ({ ...p, jobs: p.jobs.filter((j) => j.id !== jobId) })),
      };
    });
    // Also handle the actual queryKey with filters — invalidate to keep consistency
    queryClient.invalidateQueries({ queryKey: ["browse"] });
  }, [queryClient]);

  const dismissMutation = useMutation({
    mutationFn: seekerService.dismissJob,
    onMutate: async (jobId: string) => {
      await queryClient.cancelQueries({ queryKey: ["browse"] });
      const prev = queryClient.getQueryData(["browse"]);
      removeJobFromBrowse(jobId);
      return { prev };
    },
    onError: (_e, _id, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(["browse"], ctx.prev);
      toast.error("Failed to pass");
    },
    onSuccess: () => toast.success("Job passed"),
  });

  const handleGenerate = useCallback(async (jobId: string) => {
    if (generatingJobIds.has(jobId)) return;
    if (quota && !quota.allowed) {
      openPaidFeatureModal({
        feature: "resume_generation",
        title: "Upgrade plan",
        description: `You've used all ${quota.limit} generations this month. Upgrade to continue.`,
      });
      return;
    }
    addGeneratingJobId(jobId);
    toast("Resume generation in progress.");
    try {
      const app = await applicationService.ensureApplication(jobId);
      setJobAppIdMap((prev) => ({ ...prev, [jobId]: app.id }));
      await applicationService.generateResume(app.id);
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      // Remove from browse view after generate starts (per flow: added to All Applications, removed from UI)
      removeJobFromBrowse(jobId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to start generation.";
      const apiMsg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const text = apiMsg ?? msg;
      if (text.toLowerCase().includes("limit") || text.toLowerCase().includes("upgrade")) {
        openPaidFeatureModal({ feature: "resume_generation", title: "Upgrade plan", description: text });
      } else {
        toast.error(text);
      }
      removeGeneratingJobId(jobId);
    }
  }, [generatingJobIds, quota, openPaidFeatureModal, addGeneratingJobId, removeGeneratingJobId, queryClient, removeJobFromBrowse]);

  React.useEffect(() => {
    if (!drawerJobId || !currentAppId || !appStatus) return;
    const status = appStatus.automationStatus;
    if (status === "READY" && generatingJobIds.has(drawerJobId)) {
      removeGeneratingJobId(drawerJobId);
      setReadyJobIds((prev) => new Set(prev).add(drawerJobId));
      toast.success("Your resume generation is done.");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application-status", currentAppId] });
    } else if (status === "FAILED" && generatingJobIds.has(drawerJobId)) {
      removeGeneratingJobId(drawerJobId);
      setFailedInfo((prev) => ({ ...prev, [drawerJobId]: appStatus.failureReason ?? "Generation failed — please retry" }));
      toast.error(appStatus.failureReason ?? "Resume generation failed.");
    }
  }, [appStatus, drawerJobId, currentAppId, generatingJobIds, removeGeneratingJobId, queryClient]);

  const drawerGenerationStatus = (() => {
    if (!drawerJobId) return "idle" as const;
    if (readyJobIds.has(drawerJobId)) return "READY" as const;
    if (failedInfo[drawerJobId]) return "FAILED" as const;
    if (generatingJobIds.has(drawerJobId)) return "GENERATING" as const;
    return "idle" as const;
  })();
  const drawerFailureReason = drawerJobId ? failedInfo[drawerJobId] ?? null : null;

  const handleCardClick = useCallback((jobId: string) => {
    setDrawerJobId(jobId);
  }, []);

  const handleCardApply = useCallback((jobId: string) => {
    // Card Apply opens drawer (per flow), not generates directly
    setDrawerJobId(jobId);
  }, []);

  const handleDownload = useCallback(async (jobId: string) => {
    const appId = jobAppIdMap[jobId];
    if (!appId) {
      toast.error("No resume found for this job. Generate first.");
      return;
    }
    try {
      const res = await fetch(`/api/applications/${appId}/download`);
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disp = res.headers.get("Content-Disposition") ?? "";
      const m = disp.match(/filename="?([^"]+)"?/);
      a.download = m?.[1] ?? "Resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    }
  }, [jobAppIdMap]);

  const handleMarkApplied = useCallback(async (jobId: string) => {
    const appId = jobAppIdMap[jobId];
    if (!appId) {
      toast.error("Generate a resume first, then mark as applied.");
      return;
    }
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_applied" }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? "Failed to mark as applied");
      toast.success("Marked as applied — check Tracker.");
      setReadyJobIds((prev) => { const n = new Set(prev); n.delete(jobId); return n; });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      await queryClient.invalidateQueries({ queryKey: ["application-status", appId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark as applied");
    }
  }, [jobAppIdMap, queryClient]);

  const quotaBlocked = quota ? !quota.allowed : false;

  // Infinite scroll sentinel
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleToggleSave = useCallback((jobId: string) => {
    if (savedJobIds.has(jobId)) {
      unsaveMutation.mutate(jobId, { onSuccess: () => toast.success("Removed from saved"), onError: () => toast.error("Failed to remove") });
    } else {
      saveMutation.mutate(jobId, { onSuccess: () => toast.success("Job saved"), onError: () => toast.error("Failed to save") });
    }
  }, [savedJobIds, saveMutation, unsaveMutation]);

  return (
    <div className="space-y-5">
      <SearchBar value={search} onChange={setSearch} resultCount={totalCount} />
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <FilterChips activeFilters={filters as Partial<Record<string, string | undefined>>} onFilterChange={handleFilterChange} />
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => setSavedModalOpen(true)}
          aria-label={`Saved jobs ${savedCount}`}
        >
          <Bookmark className={`h-4 w-4 ${savedCount > 0 ? "fill-amber-500 text-amber-600" : ""}`} />
          Save Jobs{savedCount > 0 ? ` (${savedCount})` : ""}
        </Button>
      </div>
      <SavedJobsModal open={savedModalOpen} onOpenChange={setSavedModalOpen} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PastelCardSkeleton key={i} index={i} className="w-full" />
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
          {/* First card — Add Your Own Link (sticky, not filtered) */}
          <AddYourOwnLinkCard className="w-full" />
          {jobs.map((job, idx) => (
            <div key={job.id} className="cursor-pointer" onClick={() => handleCardClick(job.id)}>
              <PastelJobCard
                job={job}
                index={idx + 1}
                className="w-full"
                onApply={() => handleCardApply(job.id)}
                onPass={() => dismissMutation.mutate(job.id)}
              />
            </div>
          ))}
        </div>
      )}

      {isFetchingNextPage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <PastelCardSkeleton key={`more-${i}`} index={i} className="w-full" />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      <JobDrawer
        jobId={drawerJobId}
        open={drawerJobId !== null}
        onOpenChange={(open) => { if (!open) setDrawerJobId(null); }}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        onMarkApplied={handleMarkApplied}
        onToggleSave={drawerJobId ? () => handleToggleSave(drawerJobId) : undefined}
        isSaved={drawerJobId ? savedJobIds.has(drawerJobId) : false}
        generationStatus={drawerGenerationStatus}
        failureReason={drawerFailureReason}
        applyLockedLabel={quotaBlocked ? "Upgrade plan" : undefined}
      />
    </div>
  );
}
