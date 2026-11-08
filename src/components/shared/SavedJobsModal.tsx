"use client";

import { Bookmark, ExternalLink, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSavedJobs, useUnsaveJob } from "@/modules/seeker/saved-jobs/queries/use-saved-jobs";
import { useState } from "react";
import { applicationService } from "@/services/application.service";
import { useUIStore } from "@/store/use-ui-store";
import { useGenerationQuota } from "@/hooks/use-generation-quota";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/*
 * SavedJobsModal
 * Per-job Apply only (no Apply All). Handles lots via scroll max-h-[50vh] + View all link.
 */
interface SavedJobsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavedJobsModal({ open, onOpenChange }: SavedJobsModalProps) {
  const router = useRouter();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSavedJobs({ enabled: open });
  const unsaveMutation = useUnsaveJob();
  const { openPaidFeatureModal } = useUIStore();
  const { data: quota } = useGenerationQuota();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const items = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? items.length;

  const handleApply = async (jobId: string) => {
    if (quota && !quota.allowed) {
      openPaidFeatureModal({ feature: "resume_generation", title: "Upgrade plan", description: `You've used all ${quota.limit} generations this month. Upgrade to continue.` });
      return;
    }
    setApplyingId(jobId);
    try {
      const app = await applicationService.ensureApplication(jobId);
      await applicationService.generateResume(app.id);
      toast("Resume generation in progress.");
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? (e instanceof Error ? e.message : "Failed to start");
      if (msg.toLowerCase().includes("limit") || msg.toLowerCase().includes("upgrade")) {
        openPaidFeatureModal({ feature: "resume_generation", title: "Upgrade plan", description: msg });
      } else toast.error(msg);
    } finally {
      setApplyingId(null);
    }
  };

  const handleUnsave = (jobId: string) => {
    unsaveMutation.mutate(jobId, {
      onSuccess: () => toast.success("Removed from saved"),
      onError: () => toast.error("Failed to remove"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] sm:max-w-2xl rounded-xl border border-brand-border bg-white p-0 overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Saved Jobs</DialogTitle>
        <div className="p-6 pb-4 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-amber-600 fill-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-foreground">Saved Jobs</h2>
              <p className="text-xs text-brand-foreground-muted">{total} job{total !== 1 ? "s" : ""} saved for later</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[50vh]">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-brand-foreground-muted">No saved jobs yet. Your tracked jobs are in the tracker.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => { onOpenChange(false); router.push("/dashboard/tracker"); }}>
                Open tracker →
              </Button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-brand-border p-4 flex items-center justify-between gap-3" style={{ backgroundColor: "#E6FFF4" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-foreground truncate">{item.job.title}</p>
                    <p className="text-xs text-brand-foreground-muted">{item.job.companyName}</p>
                    <p className="text-[11px] text-brand-foreground-muted">{item.job.location ?? ""}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => handleUnsave(item.job.id)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-brand-border bg-white text-amber-600 hover:bg-amber-50" aria-label="Unsave">
                      <Bookmark className="h-4 w-4 fill-amber-600" />
                    </button>
                    {item.job.externalApplyUrl && (
                      <button type="button" onClick={() => window.open(item.job.externalApplyUrl!, "_blank", "noopener,noreferrer")} className="h-8 w-8 flex items-center justify-center rounded-lg border border-brand-border bg-white hover:bg-brand-surface" aria-label="Open original">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                    <Button variant="primary" size="sm" className="rounded-full bg-[#0a0a0a] hover:bg-black h-8 px-4" onClick={() => handleApply(item.job.id)} disabled={applyingId === item.job.id}>
                      {applyingId === item.job.id ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                </div>
              ))}
              {hasNextPage && (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </Button>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-brand-border bg-white flex items-center justify-between gap-3">
          <p className="text-[11px] text-brand-foreground-muted">Saved jobs are automatically removed when you apply to them</p>
          {total > 10 ? (
            <Button variant="secondary" size="sm" onClick={() => { onOpenChange(false); router.push("/dashboard/saved"); }}>
              View all saved jobs →
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
