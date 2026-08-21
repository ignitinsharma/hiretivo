"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Download, Briefcase, Loader2, CheckCircle2, AlertCircle, Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { jobService } from "@/services/job.service";
import { MatchRing } from "@/components/shared/MatchRing";

/*
 * splitBullets
 * Splits job description into bullet points for important points.
 */
function splitBullets(text: string): string[] {
  if (!text) return [];
  const parts = text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?:^|\s)[•\-]\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  if (parts.length >= 3) return parts.slice(0, 8);
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 30);
  return sentences.slice(0, 6);
}

/*
 * JobDrawer
 * Sheet/drawer showing full job details. Tsenta parity bottom bar: left View original | center Save | right Apply (not hidden).
 * Footer states: idle (Apply) → GENERATING (spinner) → READY (Download + Open in new tab + I have applied) → FAILED (retry).
 * Gate: plan/tokens via applyLockedLabel (Upgrade plan) — no verification gate.
 */
interface JobDrawerProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /* Legacy apply — kept for dashboard fallback, prefer onGenerate */
  onApply?: (jobId: string) => void;
  onGenerate?: (jobId: string) => void;
  onDownload?: (jobId: string) => void;
  onMarkApplied?: (jobId: string) => void;
  generationStatus?: "idle" | "GENERATING" | "READY" | "FAILED";
  failureReason?: string | null;
  applyLockedLabel?: string;
}

export function JobDrawer({ jobId, open, onOpenChange, onApply, onGenerate, onDownload, onMarkApplied, generationStatus = "idle", failureReason, applyLockedLabel }: JobDrawerProps) {
  const { data: session } = useSession();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["job-detail", jobId],
    queryFn: () => jobService.getJobById(jobId!),
    enabled: Boolean(jobId) && open,
    staleTime: 60_000,
  });

  const job = data?.job;
  const matchScore = data?.matchScore;
  const externalApplyUrl = job?.externalApplyUrl;

  const isGenerating = generationStatus === "GENERATING";
  const isReady = generationStatus === "READY";
  const isFailed = generationStatus === "FAILED";

  const handleGenerate = () => {
    if (!job) return;
    if (!session?.user) {
      toast.error("Please log in to generate a resume.");
      return;
    }
    if (applyLockedLabel) {
      toast.error(applyLockedLabel);
      return;
    }
    if (onGenerate) onGenerate(job.id);
    else onApply?.(job.id);
  };

  const handleDownload = () => {
    if (!job) return;
    if (onDownload) onDownload(job.id);
    else toast.info("Download will be available after generation completes.");
  };

  const handleOpenExternal = () => {
    if (externalApplyUrl) window.open(externalApplyUrl, "_blank", "noopener,noreferrer");
  };

  const handleMarkApplied = () => {
    if (!job) return;
    if (onMarkApplied) onMarkApplied(job.id);
    else toast.success("Marked as applied — check Tracker.");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {isLoading ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-sm text-brand-foreground-muted">Failed to load job details.</p>
          </div>
        ) : job ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-xl font-bold text-brand-foreground leading-snug">{job.title}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-brand-foreground-muted">{job.companyName}</span>
                  </div>
                </div>
                {matchScore !== null && matchScore !== undefined && <MatchRing score={matchScore} size={48} strokeWidth={3} />}
              </div>

              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span key={skill.id} className="inline-flex items-center rounded-md bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                    {skill.name}
                  </span>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-brand-foreground uppercase tracking-wider mb-2">Description</h4>
                  {splitBullets(job.description).length > 0 ? (
                    <ul className="list-disc ml-4 space-y-1.5 text-sm text-brand-foreground-muted leading-relaxed">
                      {splitBullets(job.description).map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-brand-foreground-muted leading-relaxed whitespace-pre-line">{job.description}</p>
                  )}
                </div>
              </div>

              {isFailed && failureReason && (
                <div className="rounded-lg border border-brand-danger/20 bg-brand-danger/5 p-3 flex items-start gap-2 text-sm text-brand-danger" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{failureReason}</span>
                </div>
              )}
            </div>

            <div className="border-t border-brand-border p-4 bg-white flex flex-col gap-3">
              {isReady ? (
                <>
                  <Button variant="primary" size="sm" className="w-full" onClick={handleDownload}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Download Resume
                  </Button>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleOpenExternal} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-brand-foreground-muted hover:text-brand-foreground py-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View original posting
                    </button>
                    <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-foreground-muted hover:bg-brand-surface" aria-label="Save job">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <Button variant="primary" size="sm" className="rounded-full bg-[#0a0a0a] hover:bg-black px-5" onClick={handleOpenExternal}>
                      Apply
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full" onClick={handleMarkApplied}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />I have applied
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleOpenExternal} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-brand-foreground-muted hover:text-brand-foreground py-2 border border-brand-border rounded-lg bg-white">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View original posting
                    </button>
                    <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-foreground-muted hover:bg-brand-surface" aria-label="Save job">
                      <Bookmark className="h-4 w-4" />
                    </button>
                    {applyLockedLabel && !isGenerating ? (
                      <div className="relative group flex-1">
                        <Button variant="primary" size="sm" className="w-full rounded-full bg-[#0a0a0a] hover:bg-black opacity-60 cursor-not-allowed" disabled aria-disabled="true" title={applyLockedLabel}>
                          Upgrade plan
                        </Button>
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 transition">
                          {applyLockedLabel}
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 rounded-full bg-[#0a0a0a] hover:bg-black"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        aria-busy={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : isFailed ? (
                          "Retry Apply"
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    )}
                  </div>
                  <button type="button" onClick={() => onOpenChange(false)} className="w-full text-xs font-medium text-brand-foreground-muted hover:text-brand-foreground py-1" disabled={isGenerating}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
