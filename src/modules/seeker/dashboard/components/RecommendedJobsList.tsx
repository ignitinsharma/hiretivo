"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { seekerService } from "@/services/seeker.service";
import { useUIStore } from "@/store/use-ui-store";
import { JobCard } from "@/components/shared/JobCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SeekerFeedResponse } from "@/services/seeker.service";
import { useEmailVerificationStatus } from "@/hooks/use-email-verification-status";

export function RecommendedJobsList() {
  const { openApplyModal, openEmailVerificationModal } = useUIStore();
  const { data: verificationStatus } = useEmailVerificationStatus();
  const queryClient = useQueryClient();
  const [dismissingJobId, setDismissingJobId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["seeker-feed"],
    queryFn: seekerService.getFeed,
  });
  const dismissMutation = useMutation({
    mutationFn: seekerService.dismissJob,
    onMutate: async (jobId: string) => {
      setDismissingJobId(jobId);
      await queryClient.cancelQueries({ queryKey: ["seeker-feed"] });
      const previousFeed = queryClient.getQueryData<SeekerFeedResponse>([
        "seeker-feed",
      ]);

      queryClient.setQueryData<SeekerFeedResponse>(
        ["seeker-feed"],
        (current) =>
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

  const handleApply = (
    jobId: string,
    title?: string,
    companyName?: string,
    applyType?: string,
    externalApplyUrl?: string | null,
  ) => {
    if (verificationStatus?.requiresVerification) {
      openEmailVerificationModal();
      return;
    }

    openApplyModal(jobId, title, companyName, applyType, externalApplyUrl);
  };

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary w-6 h-6" />
            <h2 className="text-xl font-bold text-slate-900">
              Recommended Jobs
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="pt-4 border-t border-slate-100 flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-primary w-6 h-6" />
          <h2 className="text-xl font-bold text-slate-900">Recommended Jobs</h2>
        </div>
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500">
            Failed to load recommended jobs. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary w-6 h-6" />
          <h2 className="text-xl font-bold text-slate-900">Recommended Jobs</h2>
        </div>
        <Button
          variant="link"
          size="sm"
          className="font-semibold px-0 text-primary"
        >
          View all
        </Button>
      </div>

      {data?.jobs && data.jobs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {data.jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onNotInterested={() => dismissMutation.mutate(job.id)}
              isDismissing={dismissingJobId === job.id}
              onApply={() =>
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
      ) : (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
          <p className="text-slate-500">
            No matching jobs found yet. Try updating your skills to see more
            results.
          </p>
        </div>
      )}
    </div>
  );
}
