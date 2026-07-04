"use client";

import React, { useMemo } from "react";
import { Bookmark, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";

import { JobCard } from "@/components/shared/JobCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHiretvoVerificationStatus } from "@/hooks/use-hiretivo-verification-status";
import { useUIStore } from "@/store/use-ui-store";

import { useSavedJobs, useUnsaveJob } from "../queries/use-saved-jobs";

const SKELETON_ITEMS = Array.from(
  { length: 3 },
  (_, index) => `saved-job-${index}`,
);

export function SavedJobsList() {
  const { openApplyModal } = useUIStore();
  const { data: hiretvoStatus } = useHiretvoVerificationStatus();
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSavedJobs();

  const allJobs = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const totalCount = data?.pages[0]?.pagination?.total ?? allJobs.length;
  const remaining = totalCount - allJobs.length;

  const getApplyLockedLabel = (): string | undefined => {
    if (!hiretvoStatus) return undefined;
    if (hiretvoStatus.isVerified) return undefined;
    if (hiretvoStatus.notSubmitted) return "Submit for verification";
    if (hiretvoStatus.isPending) return "Verification pending";
    if (hiretvoStatus.isRejected) return "Verification rejected";
    return undefined;
  };

  const applyLockedLabel = getApplyLockedLabel();
  const unsaveMutation = useUnsaveJob();

  const handleRemove = (jobId: string): void => {
    unsaveMutation.mutate(jobId, {
      onSuccess: () => toast.success("Job removed from saved jobs."),
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to remove saved job.",
        );
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {SKELETON_ITEMS.map((item) => (
          <Card key={item} className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mb-2 h-6 w-3/4" />
            <Skeleton className="mb-8 h-4 w-1/2" />
            <div className="flex items-center justify-between border-t border-brand-border pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg font-semibold text-brand-foreground">
          Saved jobs could not be loaded.
        </p>
      </Card>
    );
  }

  if (allJobs.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-surface text-brand-foreground">
          <Bookmark className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold leading-snug tracking-tight text-brand-foreground">
          No saved jobs yet
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-brand-foreground-muted">
          Save jobs from your recommendations so the strongest matches stay easy
          to revisit.
        </p>
        <Button asChild className="mt-6" variant="primary">
          <a href="/dashboard/browse">Browse recommendations</a>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-brand-foreground-muted">
        <BriefcaseBusiness className="h-5 w-5 text-brand-foreground" />
        <p className="text-sm font-semibold">
          {totalCount} saved {totalCount === 1 ? "job" : "jobs"}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {allJobs.map((savedJob) => (
          <JobCard
            key={savedJob.id}
            job={savedJob.job}
            isSaved
            showDescription
            applyLockedLabel={
              savedJob.application || savedJob.job.isClosed
                ? undefined
                : applyLockedLabel
            }
            onApply={
              savedJob.application || savedJob.job.isClosed
                ? undefined
                : () => {
                    if (hiretvoStatus && !hiretvoStatus.isVerified) {
                      const message =
                        hiretvoStatus.notSubmitted
                          ? "Submit your profile for Hiretivo verification before applying."
                          : hiretvoStatus.isPending
                          ? "Your verification is under review. You can apply once approved."
                          : "Your verification was rejected. Check your dashboard for next steps.";
                      toast.error(message);
                      return;
                    }
                    openApplyModal(
                      savedJob.job.id,
                      savedJob.job.title,
                      savedJob.job.companyName,
                      savedJob.job.applyType,
                      savedJob.job.externalApplyUrl,
                    );
                  }
            }
            onToggleSave={() => handleRemove(savedJob.job.id)}
          />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
            className="w-full max-w-xs"
          >
            {isFetchingNextPage ? "Loading..." : `Load more (${remaining} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
}
