"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Briefcase, MapPin, Clock, Users, Building2, FileText } from "lucide-react";
import Link from "next/link";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { jobService } from "@/services/job.service";
import { MatchRing } from "@/components/shared/MatchRing";
import { formatApplicantCount } from "@/lib/jobs/format-applicant-count";
import type { JobDetailResponse } from "@/modules/jobs/types/job.types";

/*
 * JobDrawer
 * Sheet/drawer showing full job details. Opens from Dashboard or Browse.
 * Actions: View Original Job (new tab), Apply.
 */
interface JobDrawerProps {
  jobId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (jobId: string) => void;
}

export function JobDrawer({ jobId, open, onOpenChange, onApply }: JobDrawerProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["job-detail", jobId],
    queryFn: () => jobService.getJobById(jobId!),
    enabled: Boolean(jobId) && open,
    staleTime: 60_000,
  });

  const job = data?.job;
  const matchScore = data?.matchScore;
  const externalApplyUrl = job?.externalApplyUrl;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
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
                  <SheetTitle className="text-xl font-bold text-brand-foreground leading-snug">
                    {job.title}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-brand-foreground-muted">{job.companyName}</span>
                  </div>
                </div>
                {matchScore !== null && matchScore !== undefined && (
                  <MatchRing score={matchScore} size={48} strokeWidth={3} />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center rounded-md bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-brand-foreground uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-brand-foreground-muted leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-brand-border p-6 flex flex-col gap-3">
              {externalApplyUrl ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => { const url = externalApplyUrl; if (url) window.open(url, '_blank', 'noopener,noreferrer'); }}
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  View Original Job
                </Button>
              ) : null}
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => onApply?.(job.id)}
              >
                <Briefcase className="mr-1.5 h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
