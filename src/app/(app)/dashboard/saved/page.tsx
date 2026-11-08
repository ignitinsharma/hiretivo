"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Bookmark, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSavedJobs, useUnsaveJob } from "@/modules/seeker/saved-jobs/queries/use-saved-jobs";
import { PastelJobCard, PastelCardSkeleton } from "@/components/shared/PastelJobCard";
import { applicationService } from "@/services/application.service";
import { useUIStore } from "@/store/use-ui-store";
import { useGenerationQuota } from "@/hooks/use-generation-quota";
import { toast } from "sonner";
import { SELF_HOSTED } from "@/lib/config";

/*
 * SavedJobsPage
 * Full page for saved jobs — handles lots via infinite scroll + search.
 * Browse Save Jobs button View all → pushes here. Modal shows first 20, page shows all with pagination.
 */
export default function SavedJobsPage() {
  const [search, setSearch] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useSavedJobs();
  const unsaveMutation = useUnsaveJob();
  const { data: quota } = useGenerationQuota();
  const { openPaidFeatureModal } = useUIStore();

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const filtered = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems.filter((it) => it.job.title.toLowerCase().includes(q) || it.job.companyName.toLowerCase().includes(q));
  }, [allItems, search]);

  const handleApply = async (jobId: string) => {
    if (!SELF_HOSTED && quota && !quota.allowed) {
      openPaidFeatureModal({ feature: "resume_generation", title: "Upgrade plan", description: `You've used all ${quota.limit} generations this month. Upgrade to continue.` });
      return;
    }
    setApplyingId(jobId);
    try {
      const app = await applicationService.ensureApplication(jobId);
      await applicationService.generateResume(app.id);
      toast("Resume generation in progress.");
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? (e instanceof Error ? e.message : "Failed");
      if (!SELF_HOSTED && (msg.toLowerCase().includes("limit") || msg.toLowerCase().includes("upgrade"))) openPaidFeatureModal({ feature: "resume_generation", title: "Upgrade plan", description: msg });
      else toast.error(msg);
    } finally {
      setApplyingId(null);
    }
  };

  const handleUnsave = (jobId: string) => {
    unsaveMutation.mutate(jobId, { onSuccess: () => toast.success("Removed"), onError: () => toast.error("Failed") });
  };

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Bookmark className="h-5 w-5 text-amber-600 fill-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-brand-foreground">Saved Jobs</h1>
          <p className="text-xs text-brand-foreground-muted">{allItems.length} job{allItems.length !== 1 ? "s" : ""} saved — per-job Apply only</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-foreground-muted" />
        <Input placeholder="Search by title, company..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PastelCardSkeleton key={i} index={i} className="w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-brand-foreground-muted py-12 text-center">Failed to load saved jobs.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-brand-foreground-muted py-12 text-center">{search ? "No saved jobs match search." : "No saved jobs yet — bookmark from Browse."}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item, idx) => (
            <PastelJobCard
              key={item.id}
              job={item.job}
              index={idx}
              className="w-full"
              onApply={() => handleApply(item.job.id)}
              onPass={() => handleUnsave(item.job.id)}
            />
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

      <p className="text-[11px] text-brand-foreground-muted text-center">Saved jobs are automatically removed when you apply to them — per-job Apply only.</p>
    </div>
  );
}
