"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, UserCog, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { JobCard } from "@/components/shared/JobCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVerificationStatus } from "@/hooks/use-verification-status";
import {
  useSaveJob,
  useSavedJobs,
  useUnsaveJob,
} from "@/modules/seeker/saved-jobs/queries/use-saved-jobs";
import { seekerService } from "@/services/seeker.service";
import type { SeekerFeedResponse } from "@/services/seeker.service";
import { useUIStore } from "@/store/use-ui-store";

export function RecommendedJobsList() {
  const { openApplyModal } = useUIStore();
  const hiretivo = useVerificationStatus();
  const queryClient = useQueryClient();
  const [dismissingJobId, setDismissingJobId] = useState<string | null>(null);
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [saveLoadingTextByJobId, setSaveLoadingTextByJobId] = useState<
    Map<string, string>
  >(() => new Map());

  const { data, isLoading, error } = useQuery({
    queryKey: ["seeker-feed"],
    queryFn: seekerService.getFeed,
    staleTime: 30_000,
  });
  const { data: savedJobs } = useSavedJobs();
  const { data: dashboardSummary } = useQuery({
    queryKey: ["seeker-dashboard-summary"],
    queryFn: seekerService.getDashboardSummary,
    staleTime: 0,
  });
  const saveMutation = useSaveJob();
  const unsaveMutation = useUnsaveJob();

  const savedJobIds = useMemo(
    () => new Set(savedJobs?.map((savedJob) => savedJob.job.id) ?? []),
    [savedJobs],
  );

  const dismissMutation = useMutation({
    mutationFn: seekerService.dismissJob,
    onMutate: async (jobId: string) => {
      setDismissingJobId(jobId);
      await queryClient.cancelQueries({ queryKey: ["seeker-feed"] });
      const previousFeed = queryClient.getQueryData<SeekerFeedResponse>([
        "seeker-feed",
      ]);

      queryClient.setQueryData<SeekerFeedResponse>(["seeker-feed"], (current) =>
        current
          ? {
              ...current,
              jobs: current.jobs.filter((job) => job.id !== jobId),
            }
          : current,
      );

      return { previousFeed };
    },
    onError: (error, _jobId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["seeker-feed"], context.previousFeed);
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to remove job.",
      );
    },
    onSuccess: () => {
      toast.success("Job removed from recommendations.");
    },
    onSettled: () => {
      setDismissingJobId(null);
      void queryClient.invalidateQueries({ queryKey: ["seeker-feed"] });
    },
  });

  /*
   * resolveApplyLockedLabel
   * Returns a user-facing label when the seeker's Hiretivo verification blocks applying.
   * Returns undefined when the seeker is verified (normal Apply Now flow).
   */
  const resolveApplyLockedLabel = (): string | undefined => {
    if (hiretivo.isVerified) return undefined;
    if (hiretivo.status === "PENDING" || hiretivo.status === "IN_REVIEW")
      return "Verification pending";
    if (hiretivo.status === "REJECTED") return "Fix profile to apply";
    return "Get verified to apply";
  };

  const applyLockedLabel = resolveApplyLockedLabel();

  const handleApply = (
    jobId: string,
    title?: string,
    companyName?: string,
    applyType?: string,
    externalApplyUrl?: string | null,
  ) => {
    openApplyModal(jobId, title, companyName, applyType, externalApplyUrl);
  };

  const setJobSaving = (
    jobId: string,
    isSaving: boolean,
    loadingText?: string,
  ): void => {
    setSavingJobIds((current) => {
      const next = new Set(current);
      if (isSaving) {
        next.add(jobId);
      } else {
        next.delete(jobId);
      }
      return next;
    });
    setSaveLoadingTextByJobId((current) => {
      const next = new Map(current);
      if (isSaving && loadingText) {
        next.set(jobId, loadingText);
      } else {
        next.delete(jobId);
      }
      return next;
    });
  };

  const handleToggleSave = (jobId: string): void => {
    const isSaved = savedJobIds.has(jobId);
    setJobSaving(jobId, true, isSaved ? "Removing" : "Saving");

    if (isSaved) {
      unsaveMutation.mutate(jobId, {
        onSuccess: () => toast.success("Job removed from saved jobs."),
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to remove saved job.",
          );
        },
        onSettled: () => setJobSaving(jobId, false),
      });
      return;
    }

    saveMutation.mutate(jobId, {
      onSuccess: () => toast.success("Job saved."),
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to save job.",
        );
      },
      onSettled: () => setJobSaving(jobId, false),
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-foreground">Recommended Jobs</h2>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-200" />
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="h-5 w-48 rounded bg-gray-200" />
                    <div className="h-4 w-32 rounded bg-gray-200" />
                  </div>
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-200" />
              </div>
              <div className="grid gap-2 border-t border-brand-border py-4 sm:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 rounded bg-gray-200" />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-7 w-20 rounded-lg bg-gray-200" />
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-brand-border pt-4">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-9 w-24 rounded-lg bg-gray-200" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-foreground">Recommended Jobs</h2>
        </div>
        <Card className="p-8 text-center">
          <p className="text-brand-foreground-muted">
            Failed to load recommended jobs. Please try again.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-brand-primary" />
        <h2 className="text-xl font-bold text-brand-foreground">Recommended Jobs</h2>
      </div>

      {data?.jobs && data.jobs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedJobIds.has(job.id)}
              saveActionPlacement="footer"
              isSaving={savingJobIds.has(job.id)}
              saveLoadingText={saveLoadingTextByJobId.get(job.id)}
              onToggleSave={() => handleToggleSave(job.id)}
              showDescription
              onNotInterested={() => dismissMutation.mutate(job.id)}
              isDismissing={dismissingJobId === job.id}
              applyLockedLabel={applyLockedLabel}
              onApply={
                applyLockedLabel
                  ? undefined
                  : () =>
                      handleApply(
                        job.id,
                        job.title,
                        job.companyName,
                        job.applyType,
                        job.externalApplyUrl,
                      )
              }
            />
          ))}
        </div>
      ) : (data?.totalCount ?? 0) > 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <Sparkles className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            You've dismissed all matching jobs. New opportunities are added daily — check back soon.
          </p>
        </Card>
      ) : (dashboardSummary?.profileStrength.percentage ?? 0) < 50 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <UserCog className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Complete your profile</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Add your skills and experience so we can recommend jobs tailored to you.
          </p>
          <Link href="/seeker/settings">
            <Button variant="primary" className="mt-6">
              <UserCog className="h-4 w-4" />
              Update Profile
            </Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No matching jobs yet</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            We couldn't find jobs matching your current skills. New positions are posted daily — check back soon.
          </p>
        </Card>
      )}
    </div>
  );
}
